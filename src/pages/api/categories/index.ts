import type { APIRoute } from "astro";
import type { CategoryListResponse, CategoryListQuery } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database } from "../../../db/database.types";
import { CategoryListQuerySchema, CreateCategorySchema } from "../../../lib/validation";
import { formatValidationError } from "../../../lib/validation";
import { 
  AuthenticationError, 
  ValidationError, 
  CategoryNameExistsError,
  createErrorResponse,
  handleAPIError 
} from "../../../lib/errors";

/**
 * GET /api/categories
 * 
 * Categories List API endpoint with pagination, sorting and filtering.
 * Returns user's categories with flashcard counts.
 */
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Step 2: Parse and validate query parameters
    const searchParams = Object.fromEntries(url.searchParams);
    const validationResult = CategoryListQuerySchema.safeParse(searchParams);

    if (!validationResult.success) {
      throw new ValidationError("Invalid query parameters", formatValidationError(validationResult.error));
    }

    const query: CategoryListQuery = validationResult.data;

    // Step 3: Build dynamic query with sorting
    const orderClause = `${query.sort} ${query.order}`;
    
    // Step 4: Fetch categories with flashcard counts
    const { data: categories, error: fetchError, count } = await supabase
      .from("categories")
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        flashcard_count:flashcards(count)
      `, { count: 'exact' })
      .eq("user_id", user.id)
      .order(query.sort, { ascending: query.order === 'asc' })
      .range(query.offset, query.offset + query.limit - 1);

    if (fetchError) {
      console.error("Categories fetch error:", fetchError);
      throw new Error("Failed to fetch categories");
    }

    // Step 5: Transform response data
    const transformedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name,
      flashcard_count: Array.isArray(category.flashcard_count) ? category.flashcard_count.length : 0,
      created_at: category.created_at,
      updated_at: category.updated_at,
    }));

    // Step 6: Build response with pagination
    const totalCount = count || 0;
    const hasMore = query.offset + query.limit < totalCount;

    const response: CategoryListResponse = {
      data: transformedCategories,
      pagination: {
        total: totalCount,
        limit: query.limit,
        offset: query.offset,
        has_more: hasMore,
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
 * POST /api/categories
 * 
 * Create new category endpoint.
 * Validates category name uniqueness per user.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = CreateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid input data", formatValidationError(validationResult.error));
    }

    const { name } = validationResult.data;

    // Step 3: Check for duplicate category name
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name)
      .maybeSingle();

    if (checkError) {
      console.error("Category name check error:", checkError);
      throw new Error("Failed to validate category name");
    }

    if (existingCategory) {
      throw new CategoryNameExistsError();
    }

    // Step 4: Create new category
    const { data: newCategory, error: createError } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: name,
        description: null,
      })
      .select("id, name, description, created_at, updated_at")
      .single();

    if (createError || !newCategory) {
      console.error("Category creation error:", createError);
      throw new Error("Failed to create category");
    }

    // Step 5: Return created category
    const response = {
      data: {
        id: newCategory.id,
        name: newCategory.name,
        flashcard_count: 0, // New category has no flashcards
        created_at: newCategory.created_at,
        updated_at: newCategory.updated_at,
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