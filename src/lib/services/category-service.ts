import type { SupabaseClient } from "../../db/supabase.client";
import type { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "../../types";

/**
 * Get all categories belonging to the authenticated user
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param limit - Maximum number of categories to return (default: 20)
 * @param offset - Number of categories to skip (default: 0)
 * @param sort - Field to sort by (default: created_at)
 * @param order - Sort order, either asc or desc (default: desc)
 * @returns Promise<{ data: CategoryDto[], total: number }> - Categories and total count
 */
export async function getCategories(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
  offset = 0,
  sort = "created_at",
  order: "asc" | "desc" = "desc"
): Promise<{ data: CategoryDto[]; total: number }> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting categories for user ${userId}`);

    // Validate sort field to prevent SQL injection
    const validSortFields = ["created_at", "updated_at", "name"];
    if (!validSortFields.includes(sort)) {
      sort = "created_at";
    }

    // Get total count first
    const { count, error: countError } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error(`[${requestId}] Error getting category count:`, countError);
      throw new Error(`Failed to get category count: ${countError.message}`);
    }

    // Get categories with pagination
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`[${requestId}] Error getting categories:`, error);
      throw new Error(`Failed to get categories: ${error.message}`);
    }

    // Map to DTOs by removing user_id
    const categoryDtos: CategoryDto[] = data.map((category) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...dto } = category;
      return dto;
    });

    console.log(`[${requestId}] Retrieved ${categoryDtos.length} categories for user ${userId}`);

    return {
      data: categoryDtos,
      total: count || 0,
    };
  } catch (error) {
    console.error(`Error in getCategories service:`, error);
    throw error;
  }
}

/**
 * Get a specific category by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param categoryId - ID of the category to retrieve
 * @returns Promise<CategoryDto> - The requested category
 * @throws Error if category not found or user doesn't have access
 */
export async function getCategoryById(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string
): Promise<CategoryDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting category ${categoryId} for user ${userId}`);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(`[${requestId}] Error getting category:`, error);
      if (error.code === "PGRST116") {
        throw new Error(`Category not found: ${categoryId}`);
      }
      throw new Error(`Failed to get category: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...categoryDto } = data;

    console.log(`[${requestId}] Retrieved category ${categoryId} for user ${userId}`);

    return categoryDto;
  } catch (error) {
    console.error(`Error in getCategoryById service:`, error);
    throw error;
  }
}

/**
 * Create a new category
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param category - Category data to create
 * @returns Promise<CategoryDto> - The created category
 */
export async function createCategory(
  supabase: SupabaseClient,
  userId: string,
  category: CreateCategoryDto
): Promise<CategoryDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Creating category for user ${userId}: ${category.name}`);

    // First check if a category with the same name already exists for this user
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category.name)
      .eq("user_id", userId)
      .single();

    if (existingCategory) {
      console.error(`[${requestId}] Category with name "${category.name}" already exists for user ${userId}`);
      throw new Error(`Category with name "${category.name}" already exists`);
    } else if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no results found, which is what we want
      console.error(`[${requestId}] Error checking for existing category:`, checkError);
      throw new Error(`Failed to check for existing category: ${checkError.message}`);
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: category.name,
        description: category.description || null,
        user_id: userId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Error creating category:`, error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...categoryDto } = data;

    console.log(`[${requestId}] Created category ${categoryDto.id} for user ${userId}`);

    return categoryDto;
  } catch (error) {
    console.error(`Error in createCategory service:`, error);
    throw error;
  }
}

/**
 * Update an existing category
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param categoryId - ID of the category to update
 * @param category - Category data to update
 * @returns Promise<CategoryDto> - The updated category
 * @throws Error if category not found or user doesn't have access
 */
export async function updateCategory(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  category: UpdateCategoryDto
): Promise<CategoryDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Updating category ${categoryId} for user ${userId}`);

    // First check if category exists and belongs to user
    const { error: checkError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error(`[${requestId}] Error checking category existence:`, checkError);
      if (checkError.code === "PGRST116") {
        throw new Error(`Category not found: ${categoryId}`);
      }
      throw new Error(`Failed to check category: ${checkError.message}`);
    }

    // If updating name, check if another category with that name already exists for this user
    if (category.name) {
      const { data: existingWithName, error: nameCheckError } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category.name)
        .eq("user_id", userId)
        .neq("id", categoryId) // Exclude the current category
        .single();

      if (existingWithName) {
        console.error(`[${requestId}] Another category with name "${category.name}" already exists for user ${userId}`);
        throw new Error(`Another category with name "${category.name}" already exists`);
      } else if (nameCheckError && nameCheckError.code !== "PGRST116") {
        // PGRST116 means no results found, which is what we want
        console.error(`[${requestId}] Error checking for existing category name:`, nameCheckError);
        throw new Error(`Failed to check for existing category name: ${nameCheckError.message}`);
      }
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData = {
      ...category,
      updated_at: now,
    };

    // Update the category
    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", categoryId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Error updating category:`, error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...categoryDto } = data;

    console.log(`[${requestId}] Updated category ${categoryId} for user ${userId}`);

    return categoryDto;
  } catch (error) {
    console.error(`Error in updateCategory service:`, error);
    throw error;
  }
}

/**
 * Delete a category
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param categoryId - ID of the category to delete
 * @returns Promise<void>
 * @throws Error if category not found or user doesn't have access
 */
export async function deleteCategory(supabase: SupabaseClient, userId: string, categoryId: string): Promise<void> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Deleting category ${categoryId} for user ${userId}`);

    // First check if category exists and belongs to user
    const { error: checkError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error(`[${requestId}] Error checking category existence:`, checkError);
      if (checkError.code === "PGRST116") {
        throw new Error(`Category not found: ${categoryId}`);
      }
      throw new Error(`Failed to check category: ${checkError.message}`);
    }

    // Delete the category
    const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", userId);

    if (error) {
      console.error(`[${requestId}] Error deleting category:`, error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    console.log(`[${requestId}] Deleted category ${categoryId} for user ${userId}`);
  } catch (error) {
    console.error(`Error in deleteCategory service:`, error);
    throw error;
  }
}
