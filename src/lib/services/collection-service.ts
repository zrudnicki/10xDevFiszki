import type { SupabaseClient } from "../../db/supabase.client";
import type { CollectionDto, CreateCollectionDto, UpdateCollectionDto } from "../../types";

/**
 * Get all collections belonging to the authenticated user
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param limit - Maximum number of collections to return (default: 20)
 * @param offset - Number of collections to skip (default: 0)
 * @param sort - Field to sort by (default: created_at)
 * @param order - Sort order, either asc or desc (default: desc)
 * @returns Promise<{ data: CollectionDto[], total: number }> - Collections and total count
 */
export async function getCollections(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
  offset = 0,
  sort = "created_at",
  order: "asc" | "desc" = "desc"
): Promise<{ data: CollectionDto[]; total: number }> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting collections for user ${userId}`);

    // Validate sort field to prevent SQL injection
    const validSortFields = ["created_at", "updated_at", "name"];
    if (!validSortFields.includes(sort)) {
      sort = "created_at";
    }

    // Get total count first
    const { count, error: countError } = await supabase
      .from("collections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error(`[${requestId}] Error getting collection count:`, countError);
      throw new Error(`Failed to get collection count: ${countError.message}`);
    }

    // Get collections with pagination
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`[${requestId}] Error getting collections:`, error);
      throw new Error(`Failed to get collections: ${error.message}`);
    }

    // Map to DTOs by removing user_id
    const collectionDtos: CollectionDto[] = data.map((collection) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...dto } = collection;
      return dto;
    });

    console.log(`[${requestId}] Retrieved ${collectionDtos.length} collections for user ${userId}`);

    return {
      data: collectionDtos,
      total: count || 0,
    };
  } catch (error) {
    console.error(`Error in getCollections service:`, error);
    throw error;
  }
}

/**
 * Get a specific collection by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param collectionId - ID of the collection to retrieve
 * @returns Promise<CollectionDto> - The requested collection
 * @throws Error if collection not found or user doesn't have access
 */
export async function getCollectionById(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string
): Promise<CollectionDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting collection ${collectionId} for user ${userId}`);

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(`[${requestId}] Error getting collection:`, error);
      if (error.code === "PGRST116") {
        throw new Error(`Collection not found: ${collectionId}`);
      }
      throw new Error(`Failed to get collection: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...collectionDto } = data;

    console.log(`[${requestId}] Retrieved collection ${collectionId} for user ${userId}`);

    return collectionDto;
  } catch (error) {
    console.error(`Error in getCollectionById service:`, error);
    throw error;
  }
}

/**
 * Create a new collection
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param collection - Collection data to create
 * @returns Promise<CollectionDto> - The created collection
 */
export async function createCollection(
  supabase: SupabaseClient,
  userId: string,
  collection: CreateCollectionDto
): Promise<CollectionDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Creating collection for user ${userId}: ${collection.name}`);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name: collection.name,
        description: collection.description || null,
        user_id: userId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Error creating collection:`, error);
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...collectionDto } = data;

    console.log(`[${requestId}] Created collection ${collectionDto.id} for user ${userId}`);

    return collectionDto;
  } catch (error) {
    console.error(`Error in createCollection service:`, error);
    throw error;
  }
}

/**
 * Update an existing collection
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param collectionId - ID of the collection to update
 * @param collection - Collection data to update
 * @returns Promise<CollectionDto> - The updated collection
 * @throws Error if collection not found or user doesn't have access
 */
export async function updateCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  collection: UpdateCollectionDto
): Promise<CollectionDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Updating collection ${collectionId} for user ${userId}`);

    // First check if collection exists and belongs to user
    const { error: checkError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error(`[${requestId}] Error checking collection existence:`, checkError);
      if (checkError.code === "PGRST116") {
        throw new Error(`Collection not found: ${collectionId}`);
      }
      throw new Error(`Failed to check collection: ${checkError.message}`);
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData = {
      ...collection,
      updated_at: now,
    };

    // Update the collection
    const { data, error } = await supabase
      .from("collections")
      .update(updateData)
      .eq("id", collectionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Error updating collection:`, error);
      throw new Error(`Failed to update collection: ${error.message}`);
    }

    // Map to DTO by removing user_id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...collectionDto } = data;

    console.log(`[${requestId}] Updated collection ${collectionId} for user ${userId}`);

    return collectionDto;
  } catch (error) {
    console.error(`Error in updateCollection service:`, error);
    throw error;
  }
}

/**
 * Delete a collection
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param collectionId - ID of the collection to delete
 * @returns Promise<void>
 * @throws Error if collection not found or user doesn't have access
 */
export async function deleteCollection(supabase: SupabaseClient, userId: string, collectionId: string): Promise<void> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Deleting collection ${collectionId} for user ${userId}`);

    // First check if collection exists and belongs to user
    const { error: checkError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error(`[${requestId}] Error checking collection existence:`, checkError);
      if (checkError.code === "PGRST116") {
        throw new Error(`Collection not found: ${collectionId}`);
      }
      throw new Error(`Failed to check collection: ${checkError.message}`);
    }

    // Delete the collection
    const { error } = await supabase.from("collections").delete().eq("id", collectionId).eq("user_id", userId);

    if (error) {
      console.error(`[${requestId}] Error deleting collection:`, error);
      throw new Error(`Failed to delete collection: ${error.message}`);
    }

    console.log(`[${requestId}] Deleted collection ${collectionId} for user ${userId}`);
  } catch (error) {
    console.error(`Error in deleteCollection service:`, error);
    throw error;
  }
}
