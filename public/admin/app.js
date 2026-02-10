const apiBase = '/categories';

function el(q, ctx = document) {
  return ctx.querySelector(q);
}

async function fetchJson(url, opts = {}) {
  const r = await fetch(url, opts);
  return r.json();
}

function renderTable(items) {
  const tbody = el('#table tbody');
  tbody.innerHTML = '';
  for (const it of items) {
    const tr = document.createElement('tr');
    tr.draggable = true;
    tr.dataset.id = it.id;
    tr.innerHTML = `<td><input type="checkbox" class="sel" data-id="${it.id}"/></td><td>${it.iconUrl ? '<img src="' + it.iconUrl + '" width="24"/>' : ''}</td><td>${it.name}</td><td>${it.contentCount || 0}</td><td class="${it.active ? 'active' : 'inactive'}">${it.active ? 'Active' : 'Inactive'}</td><td><button data-id="${it.id}" class="edit">Edit</button> <button data-id="${it.id}" class="del">Delete</button></td>`;
    tbody.appendChild(tr);
  }
  enableDnD();
  document
    .querySelectorAll('.edit')
    .forEach((b) => (b.onclick = (e) => loadEdit(e.target.dataset.id)));
  document.querySelectorAll('.del').forEach(
    (b) =>
      (b.onclick = async (e) => {
        if (!confirm('Delete and reassign content to Uncategorized?')) return;
        const id = e.target.dataset.id;
        await fetchJson(apiBase + '/' + id, { method: 'DELETE' });
        loadAll();
      }),
  );
}

async function loadAll() {
  const data = await fetchJson(apiBase);
  renderTable(data);
}

async function loadEdit(id) {
  const r = await fetchJson(apiBase + '/' + id);
  const it = r.data || r;
  document.getElementById('id').value = it.id || '';
  document.getElementById('name').value = it.name || '';
  document.getElementById('description').value = it.description || '';
  document.getElementById('iconUrl').value = it.iconUrl || '';
  document.getElementById('active').checked = !!it.active;
}

document.getElementById('form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('id').value;
  const dto = {
    name: document.getElementById('name').value,
    description: document.getElementById('description').value,
    iconUrl: document.getElementById('iconUrl').value,
    active: document.getElementById('active').checked,
  };
  if (id) {
    await fetchJson(apiBase + '/' + id, {
      method: 'PUT',
      body: JSON.stringify(dto),
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    await fetchJson(apiBase, {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  document.getElementById('form').reset();
  loadAll();
});

document.getElementById('openCreate').onclick = () => {
  document.getElementById('form').reset();
  document.getElementById('id').value = '';
};
document.getElementById('refresh').onclick = loadAll;
document.getElementById('cancel').onclick = (e) => {
  e.preventDefault();
  document.getElementById('form').reset();
};

document.getElementById('bulkDisable').onclick = async () => {
  const ids = Array.from(document.querySelectorAll('.sel:checked')).map(
    (i) => i.dataset.id,
  );
  if (ids.length === 0) return alert('Select rows first');
  await fetchJson(apiBase + '/bulk/toggle', {
    method: 'POST',
    body: JSON.stringify({ ids, active: false }),
    headers: { 'Content-Type': 'application/json' },
  });
  loadAll();
};
document.getElementById('bulkEnable').onclick = async () => {
  const ids = Array.from(document.querySelectorAll('.sel:checked')).map(
    (i) => i.dataset.id,
  );
  if (ids.length === 0) return alert('Select rows first');
  await fetchJson(apiBase + '/bulk/toggle', {
    method: 'POST',
    body: JSON.stringify({ ids, active: true }),
    headers: { 'Content-Type': 'application/json' },
  });
  loadAll();
};

function enableDnD() {
  let dragging = null;
  const tbody = document.querySelector('#table tbody');
  tbody.querySelectorAll('tr').forEach((row) => {
    row.addEventListener('dragstart', (e) => {
      dragging = row;
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', (e) => {
      dragging = null;
      row.classList.remove('dragging');
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      const after = getDragAfterElement(tbody, e.clientY);
      if (after == null) tbody.appendChild(dragging);
      else tbody.insertBefore(dragging, after);
    });
  });
  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll('tr:not(.dragging)'),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }

  // commit order on drop
  tbody.addEventListener('drop', async () => {
    const ids = Array.from(tbody.querySelectorAll('tr')).map(
      (r) => r.dataset.id,
    );
    await fetchJson(apiBase + '/reorder', {
      method: 'POST',
      body: JSON.stringify({ order: ids }),
      headers: { 'Content-Type': 'application/json' },
    });
    loadAll();
  });
}

// SSE realtime updates
try {
  const es = new EventSource('/categories/stream');
  es.onmessage = (ev) => {
    const payload = JSON.parse(ev.data);
    if (
      payload.type === 'init' ||
      payload.type === 'created' ||
      payload.type === 'updated' ||
      payload.type === 'deleted' ||
      payload.type === 'reordered' ||
      payload.type === 'bulk-toggle' ||
      payload.type === 'enabled' ||
      payload.type === 'disabled'
    ) {
      loadAll();
    }
  };
} catch (err) {}

loadAll();
