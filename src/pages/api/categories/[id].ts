import type { APIRoute } from "astro";
import type { SingleCategoryResponse } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database } from "../../../db/database.types";
import { CategoryIdParamSchema, UpdateCategorySchema } from "../../../lib/validation";
import { formatValidationError } from "../../../lib/validation";
import { 
  AuthenticationError, 
  ValidationError, 
  CategoryNotFoundError,
  CategoryNameExistsError,
  createErrorResponse,
  handleAPIError 
} from "../../../lib/errors";

/**
 * GET /api/categories/[id]
 * 
 * Single Category API endpoint.
 * Returns category details with flashcard count.
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Step 2: Validate category ID parameter
    const validationResult = CategoryIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      throw new ValidationError("Invalid category ID", formatValidationError(validationResult.error));
    }

    const { id } = validationResult.data;

    // Step 3: Fetch category with flashcard count
    const { data: category, error: fetchError } = await supabase
      .from("categories")
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        flashcard_count:flashcards(count)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Category fetch error:", fetchError);
      throw new Error("Failed to fetch category");
    }

    if (!category) {
      throw new CategoryNotFoundError();
    }

    // Step 4: Transform response data
    const response: SingleCategoryResponse = {
      data: {
        id: category.id,
        name: category.name,
        flashcard_count: Array.isArray(category.flashcard_count) ? category.flashcard_count.length : 0,
        created_at: category.created_at,
        updated_at: category.updated_at,
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
 * PUT /api/categories/[id]
 * 
 * Update Category API endpoint.
 * Updates category name with uniqueness validation.
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Step 2: Validate category ID parameter
    const paramValidation = CategoryIdParamSchema.safeParse(params);

    if (!paramValidation.success) {
      throw new ValidationError("Invalid category ID", formatValidationError(paramValidation.error));
    }

    const { id } = paramValidation.data;

    // Step 3: Validate request body
    const body = await request.json();
    const bodyValidation = UpdateCategorySchema.safeParse(body);

    if (!bodyValidation.success) {
      throw new ValidationError("Invalid input data", formatValidationError(bodyValidation.error));
    }

    const { name } = bodyValidation.data;

    // Step 4: Check if category exists and belongs to user
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Category existence check error:", checkError);
      throw new Error("Failed to validate category");
    }

    if (!existingCategory) {
      throw new CategoryNotFoundError();
    }

    // Step 5: Check for duplicate name (only if name is changing)
    if (existingCategory.name !== name) {
      const { data: duplicateCategory, error: duplicateError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", name)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) {
        console.error("Duplicate name check error:", duplicateError);
        throw new Error("Failed to validate category name");
      }

      if (duplicateCategory) {
        throw new CategoryNameExistsError();
      }
    }

    // Step 6: Update category
    const { data: updatedCategory, error: updateError } = await supabase
      .from("categories")
      .update({
        name: name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        flashcard_count:flashcards(count)
      `)
      .single();

    if (updateError || !updatedCategory) {
      console.error("Category update error:", updateError);
      throw new Error("Failed to update category");
    }

    // Step 7: Return updated category
    const response: SingleCategoryResponse = {
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        flashcard_count: Array.isArray(updatedCategory.flashcard_count) ? updatedCategory.flashcard_count.length : 0,
        created_at: updatedCategory.created_at,
        updated_at: updatedCategory.updated_at,
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
 * DELETE /api/categories/[id]
 * 
 * Delete Category API endpoint.
 * Cascades deletion to associated flashcards.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Step 2: Validate category ID parameter
    const validationResult = CategoryIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      throw new ValidationError("Invalid category ID", formatValidationError(validationResult.error));
    }

    const { id } = validationResult.data;

    // Step 3: Check if category exists and belongs to user
    const { data: category, error: checkError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Category existence check error:", checkError);
      throw new Error("Failed to validate category");
    }

    if (!category) {
      throw new CategoryNotFoundError();
    }

    // Step 4: Delete category (flashcards will be handled by cascade or set null)
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Category deletion error:", deleteError);
      throw new Error("Failed to delete category");
    }

    // Step 5: Return success response
    return new Response(JSON.stringify({ 
      data: { 
        message: "Category deleted successfully",
        deleted_id: id 
      } 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const apiError = handleAPIError(error);
    return createErrorResponse(apiError);
  }
}; 