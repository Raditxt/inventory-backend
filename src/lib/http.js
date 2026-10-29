export const ok = (data, status = 200) => Response.json({ data }, { status });

export const fail = (status, code, message, headers) =>
  Response.json({ error: { code, message } }, { status, headers });

export async function readJson(request) {
  try {
    const body = await request.json();
    const isPlainObject =
      body !== null && typeof body === "object" && !Array.isArray(body);
    return isPlainObject ? body : null;
  } catch {
    return null;
  }
}

export function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const isUniqueViolation = (err) => err?.code === "P2002";


export function fromResult(result, build, status = 200) {
  if (result.failure) {
    const { status: failStatus, code, message } = result.failure;
    return fail(failStatus, code, message);
  }
  return ok(build(result.data), status);
}