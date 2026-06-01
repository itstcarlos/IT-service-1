/**
 * Cloudflare Pages Functions Serverless API Endpoint
 * Path: /api/tasks
 * Handlers: GET (Fetch), POST (Create), PUT (Update)
 * Database: Cloudflare D1 (SQLite)
 * Created: 2026-06-01
 */

// Helper to generate JSON responses with CORS headers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// OPTIONS pre-flight handler for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// GET: Fetch all tasks or tasks filtered by username
export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    if (!db) {
      return jsonResponse({ error: "Cloudflare D1 Database binding 'DB' is missing. Please check your Pages console configuration." }, 500);
    }

    const { searchParams } = new URL(context.request.url);
    const username = searchParams.get('username');

    let query;
    let params = [];

    if (username) {
      query = "SELECT * FROM tasks WHERE username = ? ORDER BY reported_date DESC, id DESC";
      params = [username];
    } else {
      query = "SELECT * FROM tasks ORDER BY reported_date DESC, id DESC";
    }

    const { results } = await db.prepare(query).bind(...params).all();
    
    // Parse JSON string fields back to objects before sending to frontend
    const parsedResults = results.map(row => {
      return {
        ...row,
        image_file: row.image_file ? JSON.parse(row.image_file) : null,
        attached_file: row.attached_file ? JSON.parse(row.attached_file) : null,
        admin_upload_file: row.admin_upload_file ? JSON.parse(row.admin_upload_file) : null
      };
    });

    return jsonResponse(parsedResults);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// POST: Create a new repair request
export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    if (!db) {
      return jsonResponse({ error: "Cloudflare D1 Database binding 'DB' is missing." }, 500);
    }

    const body = await context.request.json();
    
    // Validation
    const required = ['id', 'username', 'fullname', 'department', 'phone', 'repair_type', 'description', 'reported_date', 'day_str'];
    for (const field of required) {
      if (!body[field]) {
        return jsonResponse({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const query = `
      INSERT INTO tasks (
        id, username, fullname, department, phone, repair_type, description, 
        reported_date, day_str, image_file, attached_file, status, admin_name, admin_remark, admin_upload_file
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', '', NULL)
    `;

    // Stringify attachment objects for SQLite storage
    const imageFileStr = body.image_file ? JSON.stringify(body.image_file) : null;
    const attachedFileStr = body.attached_file ? JSON.stringify(body.attached_file) : null;

    await db.prepare(query).bind(
      body.id,
      body.username,
      body.fullname,
      body.department,
      body.phone,
      body.repair_type,
      body.description,
      body.reported_date,
      body.day_str,
      imageFileStr,
      attachedFileStr
    ).run();

    return jsonResponse({ success: true, message: "Task created successfully", id: body.id });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// PUT: Update an existing task by Admin
export async function onRequestPut(context) {
  try {
    const db = context.env.DB;
    if (!db) {
      return jsonResponse({ error: "Cloudflare D1 Database binding 'DB' is missing." }, 500);
    }

    const body = await context.request.json();
    
    if (!body.id) {
      return jsonResponse({ error: "Missing task ID for update" }, 400);
    }

    // Determine what we are updating
    const updates = [];
    const params = [];

    if (body.status !== undefined) {
      updates.push("status = ?");
      params.push(body.status);
    }
    if (body.admin_name !== undefined) {
      updates.push("admin_name = ?");
      params.push(body.admin_name);
    }
    if (body.admin_remark !== undefined) {
      updates.push("admin_remark = ?");
      params.push(body.admin_remark);
    }
    if (body.admin_upload_file !== undefined) {
      updates.push("admin_upload_file = ?");
      // JSON stringify the file object
      params.push(body.admin_upload_file ? JSON.stringify(body.admin_upload_file) : null);
    }

    if (updates.length === 0) {
      return jsonResponse({ error: "No fields provided to update" }, 400);
    }

    // Add id to query parameters
    params.push(body.id);
    
    const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
    
    const result = await db.prepare(query).bind(...params).run();

    return jsonResponse({ success: true, message: "Task updated successfully", id: body.id });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
