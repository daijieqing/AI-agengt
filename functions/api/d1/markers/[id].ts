
interface Env {
  DB: any; // D1Database type reference
}

export const onRequestDelete = async (context: any) => {
  const { params, env } = context;
  const id = params.id;

  try {
    const stmt = env.DB.prepare("DELETE FROM markers WHERE id = ?");
    await stmt.bind(id).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPut = async (context: any) => {
  const { request, params, env } = context;
  const id = params.id;

  try {
    const body = await request.json();
    const { content, is_resolved } = body;

    // Build dynamic update query based on provided fields
    let query = "UPDATE markers SET ";
    const values = [];
    const updates = [];

    if (content !== undefined) {
      updates.push("content = ?");
      values.push(content);
    }
    if (is_resolved !== undefined) {
      updates.push("is_resolved = ?");
      values.push(is_resolved);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ message: "No fields to update" }), { status: 400 });
    }

    query += updates.join(", ") + " WHERE id = ?";
    values.push(id);

    const stmt = env.DB.prepare(query);
    await stmt.bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
