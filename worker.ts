
export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- API ROUTES ---

    // 1. GET Markers
    if (path === '/api/d1/markers' && request.method === 'GET') {
      if (!env.DB) return new Response(JSON.stringify({error: "Database binding 'DB' not found."}), { status: 500, headers: {'Content-Type': 'application/json'} });
      
      const projectName = url.searchParams.get("project_name");
      const pageContext = url.searchParams.get("page_context");

      if (!projectName || !pageContext) {
         return new Response(JSON.stringify({ error: "Missing required query parameters" }), { status: 400, headers: {'Content-Type': 'application/json'} });
      }

      try {
        const stmt = env.DB.prepare("SELECT * FROM markers WHERE project_name = ? AND page_context = ? ORDER BY created_at ASC");
        const { results } = await stmt.bind(projectName, pageContext).all();
        return new Response(JSON.stringify(results), { status: 200, headers: {'Content-Type': 'application/json'} });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: `D1 Error: ${e.message}` }), { status: 500, headers: {'Content-Type': 'application/json'} });
      }
    }

    // 2. CREATE Marker
    if (path === '/api/d1/markers' && request.method === 'POST') {
      if (!env.DB) return new Response(JSON.stringify({error: "Database binding 'DB' not found."}), { status: 500, headers: {'Content-Type': 'application/json'} });
      
      try {
        const body = await request.json() as any;
        const { x, y, content, author, created_at, is_resolved, project_name, page_context } = body;

        // Validation
        if (x === undefined || y === undefined || !content || !project_name || !page_context) {
           return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: {'Content-Type': 'application/json'} });
        }

        const stmt = env.DB.prepare(
          `INSERT INTO markers (x, y, content, author, created_at, is_resolved, project_name, page_context) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
        );
        const result = await stmt.bind(x, y, content, author, created_at, is_resolved, project_name, page_context).first();
        return new Response(JSON.stringify(result), { status: 201, headers: {'Content-Type': 'application/json'} });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: `D1 Error: ${e.message}` }), { status: 500, headers: {'Content-Type': 'application/json'} });
      }
    }

    // 3. DELETE / PUT Marker
    const idMatch = path.match(/^\/api\/d1\/markers\/([^\/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (!env.DB) return new Response(JSON.stringify({error: "Database binding 'DB' not found."}), { status: 500, headers: {'Content-Type': 'application/json'} });

      // DELETE
      if (request.method === 'DELETE') {
         try {
           await env.DB.prepare("DELETE FROM markers WHERE id = ?").bind(id).run();
           return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: {'Content-Type': 'application/json'} });
         } catch (e: any) {
           return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: {'Content-Type': 'application/json'} });
         }
      }

      // PUT
      if (request.method === 'PUT') {
         try {
           const body = await request.json() as any;
           const { content, is_resolved } = body;
           
           const updates = [];
           const values = [];
           if (content !== undefined) { updates.push("content = ?"); values.push(content); }
           if (is_resolved !== undefined) { updates.push("is_resolved = ?"); values.push(is_resolved); }
           
           if (updates.length > 0) {
             values.push(id);
             await env.DB.prepare(`UPDATE markers SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
           }
           
           return new Response(JSON.stringify({ success: true }), { status: 200, headers: {'Content-Type': 'application/json'} });
         } catch (e: any) {
           return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: {'Content-Type': 'application/json'} });
         }
      }
    }

    // --- STATIC ASSETS ---
    // If we get here, it's not an API call. Serve assets.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
