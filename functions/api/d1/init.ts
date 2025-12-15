
export const onRequestPost = async () => {
  return new Response(JSON.stringify({ error: "Initialization endpoint is disabled." }), { 
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
};
