import type { APIRoute } from "astro";
import type { SingleCollectionResponse, UpdateCollectionRequest } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database } from "../../../db/database.types";
import { CollectionIdParamSchema, UpdateCollectionSchema } from "../../../lib/validation";
import { formatValidationError } from "../../../lib/validation";
import { 
  AuthenticationError, 
  ValidationError, 
  CollectionNotFoundError,
  CollectionNameExistsError,
  createErrorResponse,
  handleAPIError 
} from "../../../lib/errors";

/**
 * GET /api/collections/[id]
 * 
 * Single Collection API endpoint.
 * Returns collection details with flashcard count.
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("User must be authenticated to access collections");
    }

    // Step 2: Parameter Validation
    const paramValidation = CollectionIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      throw new ValidationError("Invalid collection ID", formatValidationError(paramValidation.error).details);
    }

    const { id } = paramValidation.data;

    // Step 3: Database Query with Flashcard Count
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        flashcards!collection_id(count)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (collectionError || !collection) {
      throw new CollectionNotFoundError();
    }

    // Step 4: Format Response
    const response: SingleCollectionResponse = {
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        flashcard_count: Array.isArray(collection.flashcards) ? collection.flashcards.length : 0,
        created_at: collection.created_at!,
        updated_at: collection.updated_at,
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
 * PATCH /api/collections/[id]
 * 
 * Update Collection API endpoint.
 * Updates collection with optional fields and uniqueness validation.
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("User must be authenticated to update collections");
    }

    // Step 2: Parameter Validation
    const paramValidation = CollectionIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      throw new ValidationError("Invalid collection ID", formatValidationError(paramValidation.error).details);
    }

    const { id } = paramValidation.data;

    // Step 3: Check Collection Existence and Ownership
    const { data: existingCollection, error: existsError } = await supabase
      .from("collections")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existsError || !existingCollection) {
      throw new CollectionNotFoundError();
    }

    // Step 4: Request Body Validation
    let requestBody: UpdateCollectionRequest;
    try {
      requestBody = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    const validation = UpdateCollectionSchema.safeParse(requestBody);
    if (!validation.success) {
      throw new ValidationError("Invalid input data", formatValidationError(validation.error).details);
    }

    const validatedData = validation.data;

    // Step 5: Check Name Uniqueness (if name is being changed)
    if (validatedData.name && validatedData.name !== existingCollection.name) {
      const { data: nameConflict, error: checkError } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", validatedData.name)
        .neq("id", id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Database error checking collection name:", checkError);
        throw new Error("Failed to validate collection name");
      }

      if (nameConflict) {
        throw new CollectionNameExistsError();
      }
    }

    // Step 6: Database Update
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;

    const { data: updatedCollection, error: updateError } = await supabase
      .from("collections")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        flashcards!collection_id(count)
      `)
      .single();

    if (updateError || !updatedCollection) {
      console.error("Database error updating collection:", updateError);
      throw new Error("Failed to update collection");
    }

    // Step 7: Format Response
    const response: SingleCollectionResponse = {
      data: {
        id: updatedCollection.id,
        name: updatedCollection.name,
        description: updatedCollection.description,
        flashcard_count: Array.isArray(updatedCollection.flashcards) ? updatedCollection.flashcards.length : 0,
        created_at: updatedCollection.created_at!,
        updated_at: updatedCollection.updated_at,
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
 * DELETE /api/collections/[id]
 * 
 * Delete Collection API endpoint.
 * Deletes collection with CASCADE handling for flashcards.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("User must be authenticated to delete collections");
    }

    // Step 2: Parameter Validation
    const paramValidation = CollectionIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      throw new ValidationError("Invalid collection ID", formatValidationError(paramValidation.error).details);
    }

    const { id } = paramValidation.data;

    // Step 3: Check Collection Existence and Ownership
    const { data: existingCollection, error: existsError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existsError || !existingCollection) {
      throw new CollectionNotFoundError();
    }

    // Step 4: CASCADE Delete Collection
    const { error: deleteError } = await supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Database error deleting collection:", deleteError);
      throw new Error("Failed to delete collection");
    }

    // Step 5: Success Response
    return new Response(JSON.stringify({
      data: {
        message: "Collection deleted successfully",
        deleted_id: id,
      },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const apiError = handleAPIError(error);
    return createErrorResponse(apiError);
  }
}; 