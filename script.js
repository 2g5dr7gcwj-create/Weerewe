/**
 * سالفة كروية - منطق اللعبة
 */

// === حالة اللعبة ===
let state = {
    players: JSON.parse(localStorage.getItem('salfat_players')) || [],
    spyIndex: -1,
    currentTurn: 0,
    revealed: false,
    secret: null,
    votes: {},
    phase: 'setup' // setup, playing, voting, results
};

// === العناصر ===
const app = document.getElementById('app');

// === الدوال المساعدة ===
function savePlayers() {
    localStorage.setItem('salfat_players', JSON.stringify(state.players));
}

function getRandomStar() {
    return allStars[Math.floor(Math.random() * allStars.length)];
}

// === واجهة الإعداد ===
function renderSetup() {
    const playersHtml = state.players.map((p, i) => `
        <div class="player-item">
            <div class="player-info">
                <span class="player-number">${i + 1}</span>
                <span class="player-name">${p}</span>
            </div>
            <button class="btn-delete" onclick="removePlayer(${i})">🗑️</button>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="logo-container">
            <div class="logo">⚽</div>
        </div>
        <h1 class="title">سالفة كروية</h1>
        <p class="subtitle">اكتشف الجاسوس بين نجوم الملاعب</p>
        <div class="badge">
            <span>✨</span>
            <span>الإصدار 2026</span>
        </div>

        <div class="input-group">
            <input type="text" id="playerInput" class="input" placeholder="اكتب اسم اللاعب..." onkeypress="handleKeyPress(event)">
            <button class="btn btn-primary btn-icon" onclick="addPlayer()">➕</button>
        </div>

        ${state.players.length > 0 ? `
            <div class="players-list">
                <div class="players-header">
                    <span>👥</span>
                    <span>اللاعبون</span>
                    <span class="players-count">${state.players.length}</span>
                </div>
                ${playersHtml}
            </div>
        ` : ''}

        <div id="errorBox"></div>

        <div class="input-group">
            <button class="btn btn-success btn-full ${state.players.length < 3 ? '' : ''}" onclick="startGame()">
                🎮 ابدأ اللعب
            </button>
            ${state.players.length > 0 ? `
                <button class="btn btn-ghost btn-icon" onclick="resetAll()">🔄</button>
            ` : ''}
        </div>

        <p style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin-top: 15px;">
            تحتاج 3 لاعبين على الأقل
        </p>
    `;
}

function handleKeyPress(e) {
    if (e.key === 'Enter') addPlayer();
}

function addPlayer() {
    const input = document.getElementById('playerInput');
    const name = input.value.trim();
    if (name) {
        state.players.push(name);
        savePlayers();
        renderSetup();
    }
}

function removePlayer(index) {
    state.players.splice(index, 1);
    savePlayers();
    renderSetup();
}

function startGame() {
    if (state.players.length < 3) {
        document.getElementById('errorBox').innerHTML = `
            <div class="error-message">⚠️ يجب أن يكون هناك 3 لاعبين على الأقل</div>
        `;
        return;
    }

    state.spyIndex = Math.floor(Math.random() * state.players.length);
    state.secret = getRandomStar();
    state.currentTurn = 0;
    state.revealed = false;
    state.votes = {};
    state.phase = 'playing';
    renderPlaying();
}

function resetAll() {
    state.players = [];
    localStorage.removeItem('salfat_players');
    renderSetup();
}

// === واجهة اللعب ===
function renderPlaying() {
    const playerName = state.players[state.currentTurn];
    const isSpy = state.currentTurn === state.spyIndex;
    const totalPlayers = state.players.length;

    // مؤشر التقدم
    const dotsHtml = state.players.map((_, i) => `
        <div class="progress-dot ${i < state.currentTurn ? 'progress-dot-done' : ''} ${i === state.currentTurn ? 'progress-dot-current' : ''}"></div>
    `).join('');

    if (!state.revealed) {
        app.innerHTML = `
            <div class="progress-dots">${dotsHtml}</div>
            <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">دور اللاعب</p>
                <h2 style="font-size: 2rem; font-weight: 700;">${playerName}</h2>
            </div>
            <button class="btn btn-primary btn-full btn-large" onclick="revealCard()">
                👁️ اكشف الكلمة
            </button>
            <p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">
                🔒 تأكد أن لا يرى أحد الشاشة غيرك
            </p>
        `;
    } else {
        const cardClass = isSpy ? 'reveal-card-spy' : 'reveal-card-star';
        const iconClass = isSpy ? 'reveal-icon-spy' : 'reveal-icon-star';
        const titleClass = isSpy ? 'reveal-title-spy' : 'reveal-title-star';

        app.innerHTML = `
            <div class="progress-dots">${dotsHtml}</div>
            <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">دور اللاعب</p>
                <h2 style="font-size: 2rem; font-weight: 700;">${playerName}</h2>
            </div>

            <div class="reveal-card ${cardClass}">
                <div class="reveal-icon ${iconClass}">
                    ${isSpy ? '🕵️' : '⭐'}
                </div>
                <p class="reveal-title ${titleClass}">
                    ${isSpy ? '⚠️ أنت الجاسوس!' : 'النجم الكروي:'}
                </p>
                ${isSpy ? `
                    <p class="reveal-text">
                        لا تعرف النجم الكروي<br>
                        حاول تخمينه من حديث الآخرين
                    </p>
                ` : `
                    <p class="star-name">${state.secret.name}</p>
                    <p class="star-bio">${state.secret.bio}</p>
                `}
            </div>

            <button class="btn btn-ghost btn-full" onclick="nextPlayer()">
                ✅ تم، التالي
            </button>
        `;
    }
}

function revealCard() {
    state.revealed = true;
    renderPlaying();
}

function nextPlayer() {
    state.revealed = false;
    if (state.currentTurn + 1 >= state.players.length) {
        state.currentTurn = 0;
        state.phase = 'voting';
        renderVoting();
    } else {
        state.currentTurn++;
        renderPlaying();
    }
}

// === واجهة التصويت ===
function renderVoting() {
    const currentVoter = state.players[state.currentTurn];
    const totalVoters = state.players.length;

    const dotsHtml = state.players.map((_, i) => `
        <div class="progress-dot ${i < state.currentTurn ? 'progress-dot-done' : ''} ${i === state.currentTurn ? 'progress-dot-current' : ''}"></div>
    `).join('');

    const voteButtonsHtml = state.players.map((p, i) => `
        <button class="vote-btn" onclick="castVote(${i})">
            👤 ${p}
        </button>
    `).join('');

    app.innerHTML = `
        <div class="progress-dots">${dotsHtml}</div>
        
        <div class="voting-header">
            <div class="voting-icon">🗳️</div>
            <h2 class="voting-title">مرحلة التصويت</h2>
            <p class="voting-subtitle">اختر من تعتقد أنه الجاسوس</p>
        </div>

        <div class="voter-card">
            <p class="voter-label">دور</p>
            <p class="voter-name">${currentVoter}</p>
        </div>

        ${voteButtonsHtml}

        <p style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin-top: 15px;">
            💡 فكر جيداً قبل الاختيار
        </p>
    `;
}

function castVote(targetIndex) {
    state.votes[state.currentTurn] = targetIndex;
    
    if (state.currentTurn + 1 >= state.players.length) {
        state.phase = 'results';
        renderResults();
    } else {
        state.currentTurn++;
        renderVoting();
    }
}

// === واجهة النتائج ===
function renderResults() {
    const spyName = state.players[state.spyIndex];
    
    // حساب الأصوات
    const voteCounts = {};
    Object.values(state.votes).forEach(votedIndex => {
        voteCounts[votedIndex] = (voteCounts[votedIndex] || 0) + 1;
    });

    // الأكثر تصويتاً
    let mostVotedIndex = 0;
    let maxVotes = 0;
    Object.entries(voteCounts).forEach(([index, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            mostVotedIndex = parseInt(index);
        }
    });

    const spyCaught = mostVotedIndex === state.spyIndex;
    const mostVotedName = state.players[mostVotedIndex];

    // أشرطة الأصوات
    const barsHtml = state.players.map((p, i) => {
        const count = voteCounts[i] || 0;
        const percentage = (count / state.players.length) * 100;
        const isSpy = i === state.spyIndex;
        return `
            <div class="vote-bar-item">
                <span class="vote-bar-name ${isSpy ? 'vote-bar-name-spy' : ''}">${p}${isSpy ? ' 🕵️' : ''}</span>
                <div class="vote-bar-track">
                    <div class="vote-bar-fill ${isSpy ? 'vote-bar-fill-spy' : 'vote-bar-fill-normal'}" style="width: ${percentage}%"></div>
                </div>
                <span class="vote-bar-count">${count}</span>
            </div>
        `;
    }).join('');

    app.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
            <div class="results-icon ${spyCaught ? 'results-icon-success' : 'results-icon-fail'}">
                ${spyCaught ? '🏆' : '😅'}
            </div>
            <h2 style="font-size: 2rem; font-weight: 700;">انتهت اللعبة!</h2>
        </div>

        <div class="result-card result-card-spy">
            <p class="result-label result-label-spy">🕵️ الجاسوس كان</p>
            <p class="result-value">${spyName}</p>
        </div>

        <div class="result-card result-card-star">
            <p class="result-label result-label-star">⭐ النجم الكروي</p>
            <p class="result-value" style="font-size: 1.5rem;">${state.secret.name}</p>
            <p style="color: var(--text-secondary); margin-top: 5px;">${state.secret.bio}</p>
        </div>

        <div class="result-outcome ${spyCaught ? 'result-outcome-success' : 'result-outcome-fail'}">
            <p class="${spyCaught ? 'outcome-title-success' : 'outcome-title-fail'}">
                ${spyCaught ? '🎉 تم كشف الجاسوس!' : '😅 هرب الجاسوس!'}
            </p>
            <p style="color: var(--text-secondary);">${mostVotedName} حصل على أكبر عدد من الأصوات</p>
        </div>

        <div class="vote-bars">
            <div class="vote-bars-title">
                <span>📊</span>
                <span>توزيع الأصوات</span>
            </div>
            ${barsHtml}
        </div>

        <button class="btn btn-primary btn-full btn-large" onclick="playAgain()">
            🔄 العب مرة أخرى
        </button>
    `;
}

function playAgain() {
    state.spyIndex = -1;
    state.currentTurn = 0;
    state.revealed = false;
    state.secret = null;
    state.votes = {};
    state.phase = 'setup';
    renderSetup();
}

// === بدء اللعبة ===
renderSetup();
