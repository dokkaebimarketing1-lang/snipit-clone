const SNIPIT_URL = "http://localhost:3000"; // Change to production URL

document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const boardsSection = document.getElementById("boards-section");
  const statusSection = document.getElementById("status-section");
  const loginBtn = document.getElementById("login-btn");
  const saveBtn = document.getElementById("save-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const boardsList = document.getElementById("boards-list");

  // Check if user is logged in
  const session = await chrome.storage.local.get(["user", "accessToken"]);

  if (session.user && session.accessToken) {
    showBoardsSection(session.user);
    loadBoards(session.accessToken);
  } else {
    loginSection.classList.remove("hidden");
  }

  loginBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: `${SNIPIT_URL}/auth/callback?next=/` });
  });

  logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove(["user", "accessToken"]);
    boardsSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
  });

  saveBtn.addEventListener("click", async () => {
    const selected = document.querySelector(".board-item.selected");
    if (!selected) return;

    const boardId = selected.dataset.boardId;
    saveBtn.textContent = "저장 중...";
    saveBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.tabs.sendMessage(tab.id, { action: "getAdData" });

      if (result && result.data) {
        const res = await fetch(`${SNIPIT_URL}/api/save-ad`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ ...result.data, boardId }),
        });

        if (res.ok) {
          showStatus("저장 완료!", "success");
        } else {
          showStatus("저장 실패. 다시 시도해주세요.", "error");
        }
      } else {
        showStatus("이 페이지에서 광고 정보를 찾을 수 없습니다.", "error");
      }
    } catch (err) {
      showStatus("저장 실패. 다시 시도해주세요.", "error");
    }

    saveBtn.textContent = "선택한 보드에 저장";
    saveBtn.disabled = false;
  });

  function showBoardsSection(user) {
    loginSection.classList.add("hidden");
    boardsSection.classList.remove("hidden");
    document.getElementById("user-avatar").src = user.avatar_url || "";
    document.getElementById("user-name").textContent = user.full_name || user.email || "사용자";
  }

  async function loadBoards(token) {
    try {
      const res = await fetch(`${SNIPIT_URL}/api/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const boards = await res.json();

      boardsList.innerHTML = boards
        .map(
          (b) =>
            `<div class="board-item" data-board-id="${b.id}">
              <span class="board-icon">📋</span>
              <span class="board-name">${b.name}</span>
              <span class="board-count">${b.item_count || 0}</span>
            </div>`
        )
        .join("");

      boardsList.querySelectorAll(".board-item").forEach((item) => {
        item.addEventListener("click", () => {
          boardsList.querySelectorAll(".board-item").forEach((i) => {
            i.classList.remove("selected");
          });
          item.classList.add("selected");
          saveBtn.disabled = false;
        });
      });
    } catch {
      boardsList.innerHTML = '<div class="error">보드를 불러올 수 없습니다.</div>';
    }
  }

  function showStatus(message, type) {
    statusSection.classList.remove("hidden");
    const statusMsg = document.getElementById("status-message");
    statusMsg.textContent = message;
    statusMsg.className = `status ${type}`;
    setTimeout(() => statusSection.classList.add("hidden"), 3000);
  }
});
