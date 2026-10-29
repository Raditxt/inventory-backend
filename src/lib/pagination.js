
export function parsePagination(params) {
  const page = Math.max(Math.floor(Number(params.get("page"))) || 1, 1);
  const limit = Math.min(Math.max(Math.floor(Number(params.get("limit"))) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}