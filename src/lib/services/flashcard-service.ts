import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardDto, CreateFlashcardDto, UpdateFlashcardDto } from "../../types";

/**
 * Get all flashcards belonging to the authenticated user
 * Supports filtering by collection or category, pagination, and sorting
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param options - Query options
 * @returns Promise<{ data: FlashcardDto[], total: number }> - Flashcards and total count
 */
export async function getFlashcards(
  supabase: SupabaseClient,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    sort?: string;
    order?: "asc" | "desc";
    collectionId?: string | null;
    categoryId?: string | null;
    search?: string | null;
  } = {}
): Promise<{ data: FlashcardDto[]; total: number }> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting flashcards for user ${userId}`);

    const {
      limit = 20,
      offset = 0,
      sort = "created_at",
      order = "desc",
      collectionId = null,
      categoryId = null,
      search = null,
    } = options;

    // Validate sort field to prevent SQL injection
    const validSortFields = ["created_at", "updated_at", "front", "back"];
    const sortField = validSortFields.includes(sort) ? sort : "created_at";

    // Build query
    let query = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply filters
    if (collectionId) {
      query = query.eq("collection_id", collectionId);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (search) {
      query = query.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
    }

    // Get total count
    const { count, error: countError } = await query;

    if (countError) {
      console.error(`[${requestId}] Error getting flashcard count:`, countError);
      throw new Error(`Failed to get flashcard count: ${countError.message}`);
    }

    // Get flashcards with pagination and sorting
    const { data, error } = await query
      .order(sortField, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`[${requestId}] Error getting flashcards:`, error);
      throw new Error(`Failed to get flashcards: ${error.message}`);
    }

    // Map to DTOs by removing user_id
    const flashcardDtos: FlashcardDto[] = data.map((flashcard) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...dto } = flashcard;
      return dto;
    });

    console.log(`[${requestId}] Retrieved ${flashcardDtos.length} flashcards for user ${userId}`);

    return {
      data: flashcardDtos,
      total: count || 0,
    };
  } catch (error) {
    console.error(`Error in getFlashcards service:`, error);
    throw error;
  }
}

/**
 * Get a specific flashcard by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param flashcardId - ID of the flashcard to retrieve
 * @returns Promise<FlashcardDto> - The requested flashcard
 * @throws Error if flashcard not found or user doesn't have access
 */
export async function getFlashcardById(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string
): Promise<FlashcardDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting flashcard ${flashcardId} for user ${userId}`);

    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(`[${requestId}] Error getting flashcard:`, error);
      if (error.code === "PGRST116") {
        throw new Error(`Flashcard not found: ${flashcardId}`);
      }
      throw new Error(`Failed to get flashcard: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDto } = data;

    console.log(`[${requestId}] Retrieved flashcard ${flashcardId} for user ${userId}`);

    return flashcardDto;
  } catch (error) {
    console.error(`Error in getFlashcardById service:`, error);
    throw error;
  }
}

/**
 * Create a new flashcard
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param flashcard - Flashcard data to create
 * @returns Promise<FlashcardDto> - The created flashcard
 */
export async function createFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcard: CreateFlashcardDto
): Promise<FlashcardDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Creating flashcard for user ${userId}`);

    // Check if collection_id exists and belongs to the user if provided
    if (flashcard.collection_id) {
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("id")
        .eq("id", flashcard.collection_id)
        .eq("user_id", userId)
        .single();

      if (collectionError) {
        console.error(`[${requestId}] Error checking collection:`, collectionError);
        if (collectionError.code === "PGRST116") {
          throw new Error(`Collection not found: ${flashcard.collection_id}`);
        }
        throw new Error(`Failed to check collection: ${collectionError.message}`);
      }
    }

    // Check if category_id exists and belongs to the user if provided
    if (flashcard.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", flashcard.category_id)
        .eq("user_id", userId)
        .single();

      if (categoryError) {
        console.error(`[${requestId}] Error checking category:`, categoryError);
        if (categoryError.code === "PGRST116") {
          throw new Error(`Category not found: ${flashcard.category_id}`);
        }
        throw new Error(`Failed to check category: ${categoryError.message}`);
      }
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("flashcards")
      .insert({
        front: flashcard.front,
        back: flashcard.back,
        collection_id: flashcard.collection_id || null,
        category_id: flashcard.category_id || null,
        user_id: userId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Error creating flashcard:`, error);
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDto } = data;

    console.log(`[${requestId}] Created flashcard ${flashcardDto.id} for user ${userId}`);

    return flashcardDto;
  } catch (error) {
    console.error(`Error in createFlashcard service:`, error);
    throw error;
  }
}

/**
 * Create multiple flashcards at once
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param flashcards - Array of flashcard data to create
 * @returns Promise<FlashcardDto[]> - The created flashcards
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  userId: string,
  flashcards: CreateFlashcardDto[]
): Promise<FlashcardDto[]> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Creating ${flashcards.length} flashcards for user ${userId}`);

    // Validate input
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("No flashcards provided for creation");
    }

    // Unique collections and categories to check
    const collectionIds = new Set<string>();
    const categoryIds = new Set<string>();

    // Extract unique IDs
    flashcards.forEach((flashcard) => {
      if (flashcard.collection_id) {
        collectionIds.add(flashcard.collection_id);
      }
      if (flashcard.category_id) {
        categoryIds.add(flashcard.category_id);
      }
    });

    // Check collections if any
    if (collectionIds.size > 0) {
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", userId)
        .in("id", Array.from(collectionIds));

      if (collectionsError) {
        console.error(`[${requestId}] Error checking collections:`, collectionsError);
        throw new Error(`Failed to check collections: ${collectionsError.message}`);
      }

      // Verify all requested collections exist
      const foundCollectionIds = new Set(collections.map((c) => c.id));
      const missingCollectionIds = Array.from(collectionIds).filter((id) => !foundCollectionIds.has(id));

      if (missingCollectionIds.length > 0) {
        throw new Error(`Collections not found or not accessible: ${missingCollectionIds.join(", ")}`);
      }
    }

    // Check categories if any
    if (categoryIds.size > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .in("id", Array.from(categoryIds));

      if (categoriesError) {
        console.error(`[${requestId}] Error checking categories:`, categoriesError);
        throw new Error(`Failed to check categories: ${categoriesError.message}`);
      }

      // Verify all requested categories exist
      const foundCategoryIds = new Set(categories.map((c) => c.id));
      const missingCategoryIds = Array.from(categoryIds).filter((id) => !foundCategoryIds.has(id));

      if (missingCategoryIds.length > 0) {
        throw new Error(`Categories not found or not accessible: ${missingCategoryIds.join(", ")}`);
      }
    }

    const now = new Date().toISOString();

    // Prepare data for insertion
    const flashcardsToInsert = flashcards.map((flashcard) => ({
      front: flashcard.front,
      back: flashcard.back,
      collection_id: flashcard.collection_id || null,
      category_id: flashcard.category_id || null,
      user_id: userId,
      created_at: now,
      updated_at: now,
    }));

    // Create all flashcards in a single transaction
    const { data, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select();

    if (error) {
      console.error(`[${requestId}] Error creating flashcards:`, error);
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    // Map to DTOs
    const flashcardDtos: FlashcardDto[] = data.map((flashcard) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...dto } = flashcard;
      return dto;
    });

    console.log(`[${requestId}] Created ${flashcardDtos.length} flashcards for user ${userId}`);

    return flashcardDtos;
  } catch (error) {
    console.error(`Error in createFlashcards service:`, error);
    throw error;
  }
}

/**
 * Update an existing flashcard
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param flashcardId - ID of the flashcard to update
 * @param flashcard - Flashcard data to update
 * @returns Promise<FlashcardDto> - The updated flashcard
 * @throws Error if flashcard not found or user doesn't have access
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string,
  flashcard: UpdateFlashcardDto
): Promise<FlashcardDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Updating flashcard ${flashcardId} for user ${userId}`);

    // First check if flashcard exists and belongs to user
    const { error: checkError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error(`[${requestId}] Error checking flashcard existence:`, checkError);
      if (checkError.code === "PGRST116") {
        throw new Error(`Flashcard not found: ${flashcardId}`);
      }
      throw new Error(`Failed to check flashcard: ${checkError.message}`);
    }

    // Check if collection_id exists and belongs to the user if provided
    if (flashcard.collection_id) {
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("id")
        .eq("id", flashcard.collection_id)
        .eq("user_id", userId)
        .single();

      if (collectionError) {
        console.error(`[${requestId}] Error checking collection:`, collectionError);
        if (collectionError.code === "PGRST116") {
          throw new Error(`Collection not found: ${flashcard.collection_id}`);
        }
        throw new Error(`Failed to check collection: ${collectionError.message}`);
      }
    }

    // Check if category_id exists and belongs to the user if provided
    if (flashcard.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", flashcard.category_id)
        .eq("user_id", userId)
        .single();

      if (categoryError) {
        console.error(`[${requestId}] Error checking category:`, categoryError);
        if (categoryError.code === "PGRST116") {
          throw new Error(`Category not found: ${flashcard.category_id}`);
        }
        throw new Error(`Failed to check category: ${categoryError.message}`);
      }
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData = {
      ...flashcard,
      updated_at: now,
    };

    // Update the flashcard
    const { data, error } = await supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Error updating flashcard:`, error);
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDto } = data;

    console.log(`[${requestId}] Updated flashcard ${flashcardId} for user ${userId}`);

    return flashcardDto;
  } catch (error) {
    console.error(`Error in updateFlashcard service:`, error);
    throw error;
  }
}

/**
 * Delete a flashcard
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param flashcardId - ID of the flashcard to delete
 * @returns Promise<void>
 * @throws Error if flashcard not found or user doesn't have access
 */
export async function deleteFlashcard(supabase: SupabaseClient, userId: string, flashcardId: string): Promise<void> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Deleting flashcard ${flashcardId} for user ${userId}`);

    // First check if flashcard exists and belongs to user
    const { error: checkError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error(`[${requestId}] Error checking flashcard existence:`, checkError);
      if (checkError.code === "PGRST116") {
        throw new Error(`Flashcard not found: ${flashcardId}`);
      }
      throw new Error(`Failed to check flashcard: ${checkError.message}`);
    }

    // Delete the flashcard
    const { error } = await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

    if (error) {
      console.error(`[${requestId}] Error deleting flashcard:`, error);
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    console.log(`[${requestId}] Deleted flashcard ${flashcardId} for user ${userId}`);
  } catch (error) {
    console.error(`Error in deleteFlashcard service:`, error);
    throw error;
  }
}
