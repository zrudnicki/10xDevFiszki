import type { APIRoute } from "astro";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * API endpoint for fetching flashcard review history
 * Returns data formatted for visualizations in the ReviewHistoryChart
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Get authenticated Supabase client
    const supabaseClient = getSupabaseServerClient(cookies);
    
    // Parse query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "month"; // "week", "month", "year"
    const collectionId = url.searchParams.get("collection_id");
    const categoryId = url.searchParams.get("category_id");
    
    // Get user ID from session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const userId = session.user.id;
    
    // Define date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to month
    }
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Fetch review history from flashcard_reviews table
    let reviewHistoryQuery = supabaseClient
      .from("flashcard_reviews")
      .select(`
        id,
        flashcard_id,
        status,
        created_at,
        quality,
        flashcards!inner(
          collection_id,
          category_id
        )
      `)
      .eq("user_id", userId)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .order("created_at", { ascending: true });
    
    // Apply collection/category filters if provided
    if (collectionId) {
      reviewHistoryQuery = reviewHistoryQuery.eq("flashcards.collection_id", collectionId);
    }
    
    if (categoryId) {
      reviewHistoryQuery = reviewHistoryQuery.eq("flashcards.category_id", categoryId);
    }
    
    const { data: reviewData, error: reviewError } = await reviewHistoryQuery;
    
    if (reviewError) {
      console.error("Error fetching review history:", reviewError);
      return new Response(JSON.stringify({ error: "Failed to fetch review history" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Fetch upcoming reviews (cards with next_review_at in the future)
    let upcomingReviewsQuery = supabaseClient
      .from("flashcards")
      .select("id, next_review_at")
      .eq("user_id", userId)
      .gt("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true });
    
    if (collectionId) {
      upcomingReviewsQuery = upcomingReviewsQuery.eq("collection_id", collectionId);
    }
    
    if (categoryId) {
      upcomingReviewsQuery = upcomingReviewsQuery.eq("category_id", categoryId);
    }
    
    const { data: upcomingData, error: upcomingError } = await upcomingReviewsQuery;
    
    if (upcomingError) {
      console.error("Error fetching upcoming reviews:", upcomingError);
      // Continue despite error
    }
    
    // Fetch total card statistics
    let totalStatsQuery = supabaseClient
      .from("flashcards")
      .select("id, reviews_count", { count: "exact" })
      .eq("user_id", userId);
    
    if (collectionId) {
      totalStatsQuery = totalStatsQuery.eq("collection_id", collectionId);
    }
    
    if (categoryId) {
      totalStatsQuery = totalStatsQuery.eq("category_id", categoryId);
    }
    
    const { data: totalCards, count: totalCount, error: totalError } = await totalStatsQuery;
    
    if (totalError) {
      console.error("Error fetching total cards:", totalError);
      // Continue despite error
    }
    
    // Count mastered cards (interval_days > 30 days)
    let masteredCardsQuery = supabaseClient
      .from("flashcards")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .gt("interval_days", 30);
    
    if (collectionId) {
      masteredCardsQuery = masteredCardsQuery.eq("collection_id", collectionId);
    }
    
    if (categoryId) {
      masteredCardsQuery = masteredCardsQuery.eq("category_id", categoryId);
    }
    
    const { count: masteredCount, error: masteredError } = await masteredCardsQuery;
    
    if (masteredError) {
      console.error("Error fetching mastered cards:", masteredError);
      // Continue despite error
    }
    
    // Process the data to group reviews by date
    const reviewHistory = processReviewHistory(reviewData || []);
    
    // Process upcoming reviews by date
    const upcomingReviews = processUpcomingReviews(upcomingData || []);
    
    // Return the processed data
    return new Response(JSON.stringify({
      reviewHistory,
      upcomingReviews,
      stats: {
        totalCards: totalCount || 0,
        masteredCards: masteredCount || 0,
        learningCards: (totalCount || 0) - (masteredCount || 0)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error in /api/flashcards/review-history:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

/**
 * Process review history data to format it for the chart
 */
function processReviewHistory(reviews: any[]) {
  // Group reviews by date
  const reviewsByDate = reviews.reduce((acc, review) => {
    const date = new Date(review.created_at).toISOString().split("T")[0];
    
    if (!acc[date]) {
      acc[date] = {
        learned: 0,
        reviewed: 0,
        totalReviews: 0,
        qualitySum: 0
      };
    }
    
    if (review.status === "learned") {
      acc[date].learned += 1;
    } else {
      acc[date].reviewed += 1;
    }
    
    acc[date].totalReviews += 1;
    acc[date].qualitySum += review.quality || 0;
    
    return acc;
  }, {});
  
  // Convert to array format for charts
  return Object.entries(reviewsByDate).map(([date, data]: [string, any]) => ({
    date,
    learned: data.learned,
    reviewed: data.reviewed,
    totalReviews: data.totalReviews,
    averageRecall: data.totalReviews > 0 ? data.qualitySum / data.totalReviews : 0
  }));
}

/**
 * Process upcoming reviews data
 */
function processUpcomingReviews(upcomingReviews: any[]) {
  // Group by date and count
  const reviewsByDate = upcomingReviews.reduce((acc, review) => {
    const date = new Date(review.next_review_at).toISOString().split("T")[0];
    
    if (!acc[date]) {
      acc[date] = 0;
    }
    
    acc[date] += 1;
    return acc;
  }, {});
  
  // Convert to array format for charts
  return Object.entries(reviewsByDate).map(([date, count]: [string, number]) => ({
    date,
    count
  }));
} 