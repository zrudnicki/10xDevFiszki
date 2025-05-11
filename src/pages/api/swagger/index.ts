import type { APIRoute } from "astro";
import { swaggerSpec } from "../../../lib/swagger";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(swaggerSpec),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}; 