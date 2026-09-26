async function nextId(connection, table, column) {
    const lockName = `buildtrack:${table}:${column}`;
    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);

    if (lockRows[0].acquired !== 1) {
        throw new Error(`Could not acquire ID lock for ${table}`);
    }

    const [rows] = await connection.query(
        `SELECT COALESCE(MAX(\`${column}\`), 0) + 1 AS next_id FROM \`${table}\``
    );

    return { id: Number(rows[0].next_id), lockName };
}

async function releaseIdLocks(connection, lockNames) {
    for (const lockName of lockNames) {
        await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
    }
}

function value(body, ...keys) {
    for (const key of keys) {
        if (body[key] !== undefined) return body[key];
    }
    return undefined;
}

function success(res, data, statusCode = 200) {
    return res.status(statusCode).json({ status: 'success', data });
}

function failure(res, error, statusCode = 500) {
    return res.status(statusCode).json({ status: 'error', message: error.message });
}

module.exports = { nextId, releaseIdLocks, value, success, failure };