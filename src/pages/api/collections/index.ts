import type { APIRoute } from "astro";
import type { CollectionListResponse, CollectionListQuery, CreateCollectionRequest, SingleCollectionResponse } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database } from "../../../db/database.types";
import { CollectionListQuerySchema, CreateCollectionSchema } from "../../../lib/validation";
import { formatValidationError } from "../../../lib/validation";
import { 
  AuthenticationError, 
  ValidationError,
  CollectionNameExistsError,
  createErrorResponse,
  handleAPIError 
} from "../../../lib/errors";

/**
 * GET /api/collections
 * 
 * Collections List API endpoint with pagination, sorting and flashcard counting.
 * Returns user's collections with flashcard counts.
 */
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("User must be authenticated to access collections");
    }

    // Step 2: Query Parameter Validation
    const searchParams = Object.fromEntries(url.searchParams);
    const queryValidation = CollectionListQuerySchema.safeParse(searchParams);
    
    if (!queryValidation.success) {
      throw new ValidationError("Invalid query parameters", formatValidationError(queryValidation.error).details);
    }

    const query: CollectionListQuery = queryValidation.data;

    // Step 3: Database Query with Flashcard Counting
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        flashcards!collection_id(count)
      `)
      .eq("user_id", user.id)
      .order(query.sort!, { ascending: query.order === 'asc' })
      .range(query.offset!, query.offset! + query.limit! - 1);

    if (collectionsError) {
      console.error("Database error fetching collections:", collectionsError);
      throw new Error("Failed to fetch collections");
    }

    // Step 4: Get Total Count for Pagination
    const { count: totalCount, error: countError } = await supabase
      .from("collections")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Database error counting collections:", countError);
      throw new Error("Failed to count collections");
    }

    // Step 5: Format Response Data
    const formattedCollections = collections?.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      flashcard_count: Array.isArray(collection.flashcards) ? collection.flashcards.length : 0,
      created_at: collection.created_at!,
      updated_at: collection.updated_at,
    })) || [];

    // Step 6: Build Paginated Response
    const response: CollectionListResponse = {
      data: formattedCollections,
      pagination: {
        total: totalCount || 0,
        limit: query.limit!,
        offset: query.offset!,
        has_more: (query.offset! + query.limit!) < (totalCount || 0),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const apiError = handleAPIError(error);
    return createErrorResponse(apiError);
  }
};

/**
 * POST /api/collections
 * 
 * Create Collection API endpoint.
 * Creates new collection with uniqueness validation.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("User must be authenticated to create collections");
    }

    // Step 2: Request Body Validation
    let requestBody: CreateCollectionRequest;
    try {
      requestBody = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    const validation = CreateCollectionSchema.safeParse(requestBody);
    if (!validation.success) {
      throw new ValidationError("Invalid input data", formatValidationError(validation.error).details);
    }

    const validatedData = validation.data;

    // Step 3: Check Name Uniqueness
    const { data: existingCollection, error: checkError } = await supabase
      .from("collections")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", validatedData.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Database error checking collection name:", checkError);
      throw new Error("Failed to validate collection name");
    }

    if (existingCollection) {
      throw new CollectionNameExistsError();
    }

    // Step 4: Database Insert
    const { data: newCollection, error: insertError } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description || null,
      })
      .select()
      .single();

    if (insertError || !newCollection) {
      console.error("Database error creating collection:", insertError);
      throw new Error("Failed to create collection");
    }

    // Step 5: Format Response
    const response: SingleCollectionResponse = {
      data: {
        id: newCollection.id,
        name: newCollection.name,
        description: newCollection.description,
        flashcard_count: 0, // New collection has no flashcards
        created_at: newCollection.created_at!,
        updated_at: newCollection.updated_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const apiError = handleAPIError(error);
    return createErrorResponse(apiError);
  }
}; 