
interface Env {
  DB: any; // D1Database type reference
}

export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const projectName = url.searchParams.get("project_name");
  const pageContext = url.searchParams.get("page_context");

  // 1. Validate Binding
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database binding 'DB' not found in environment." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. Validate Query Params
  if (!projectName || !pageContext) {
    return new Response(JSON.stringify({ error: "Missing required query parameters: project_name, page_context" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const stmt = env.DB.prepare("SELECT * FROM markers WHERE project_name = ? AND page_context = ? ORDER BY created_at ASC");
    const { results } = await stmt.bind(projectName, pageContext).all();
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `D1 Error: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database binding 'DB' not found in environment." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { x, y, content, author, created_at, is_resolved, project_name, page_context } = body;

    // Validate required fields
    if (x === undefined || y === undefined || !content || !project_name || !page_context) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stmt = env.DB.prepare(
      `INSERT INTO markers (x, y, content, author, created_at, is_resolved, project_name, page_context) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
    );
    
    // Use .first() to get the returned ID
    const result = await stmt.bind(x, y, content, author, created_at, is_resolved, project_name, page_context).first();

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `D1 Error: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
