// ==========================================================================
// DriveGenius v1.0.0 - 普通免許 学科試験 本番対策AIトレーナー
// (Based on QuaGenius v2.30 architecture)
// ==========================================================================

const EXAM_DATA = window.EXAM_DATA || {};
const SYLLABUS_DATA = window.SYLLABUS_DATA || {};
const TRAFFIC_LAW_REFERENCE = window.TRAFFIC_LAW_REFERENCE || '';
const CURATED_QUESTION_BANK = Array.isArray(window.CURATED_QUESTION_BANK) ? window.CURATED_QUESTION_BANK : [];
const ROAD_SIGNS = window.ROAD_SIGNS || {};
const HAZARD_SCENES = window.HAZARD_SCENES || {};

const STORAGE_KEYS = {
    stats: 'drivegenius_stats',
    mistakes: 'drivegenius_mistakes',
    bookmarks: 'drivegenius_bookmarks',
    updatedAt: 'drivegenius_updated_at',
    gasUrl: 'drivegenius_gas_url',
    gasToken: 'drivegenius_gas_token',
    bankSeen: 'drivegenius_bank_seen'
};

const CHANGELOG_DATA = [
    {
        version: 'v1.0.0',
        date: '2026/11/26',
        tag: '初回リリース・普通免許本番仕様',
        latest: true,
        items: [
            '🚗 QuaGenius v2.30 をベースに、普通自動車第一種運転免許（仮免・本免）の学科試験本番仕様へ全面刷新',
            '⭕❌ 本番の「○×（正誤）問題（1点）」および本免特有の「危険予測イラスト3連○×（全問正解2点）」UI・配点ロジックを搭載',
            '🚦 日本の道路標識・道路標示35種のSVGライブラリ＋危険予測イラスト10シーン（16:9 SVG）を内蔵し、視覚問題を完全再現',
            '🛡️ 道路交通法（積載1.2倍改正・特定小型原付・普通免許3.5t未満等）に厳密準拠した63問の精査済み問題バンク（APIキー不要）＋AI類題生成のハイブリッド構成を採用',
            '🤖 AI生成時も道路交通法リファレンス注入＋Structured Outputs＋SVG ID実在チェックで誤判定（ハルシネーション）を徹底抑制',
            '🗺️ 普通免許用3階層シラバス網羅マップ・消化型復習モード・AI教習指導員チャット・TTS音声読み上げ・PDF印刷・GAS Googleドライブ自動同期を完全継承'
        ]
    }
];

function createDefaultFormatStats() {
    return {
        tf: { total: 0, correct: 0 },
        sign: { total: 0, correct: 0 },
        hazard: { total: 0, correct: 0 },
        trick: { total: 0, correct: 0 }
    };
}

function normalizeStatsObject(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const fs = base.formatStats && typeof base.formatStats === 'object' ? base.formatStats : {};
    return {
        total: Number(base.total) || 0,
        correct: Number(base.correct) || 0,
        categories: base.categories && typeof base.categories === 'object' ? base.categories : {},
        dailyHistory: base.dailyHistory && typeof base.dailyHistory === 'object' ? base.dailyHistory : {},
        subtopics: base.subtopics && typeof base.subtopics === 'object' ? base.subtopics : {},
        formatStats: {
            tf: fs.tf || { total: 0, correct: 0 },
            sign: fs.sign || { total: 0, correct: 0 },
            hazard: fs.hazard || { total: 0, correct: 0 },
            trick: fs.trick || { total: 0, correct: 0 }
        }
    };
}

// State
let currentQuiz = null;
let currentExam = 'honmen';
let currentCategory = '';
let isReviewMode = false;
let isBookmarkMode = false;
let isCurrentQuizAnswered = false;
let hazardUserSelections = [null, null, null];

let stats = normalizeStatsObject(JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || 'null'));
let mistakes = JSON.parse(localStorage.getItem(STORAGE_KEYS.mistakes) || '[]');
let bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookmarks) || '[]');
let bankSeenIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.bankSeen) || '[]');
if (!Array.isArray(mistakes)) mistakes = [];
if (!Array.isArray(bookmarks)) bookmarks = [];
if (!Array.isArray(bankSeenIds)) bankSeenIds = [];

let nextQuizPromise = null;
let prefetchTimer = null;
let recentSubtopics = [];

// Learning Tracking, TTS & AI Tutor State
let sessionSeconds = 0;
let isSpeaking = false;
let currentTutorHistory = [];
let isTutorLoading = false;

// Cloud Sync State (Google Drive via GAS)
let cloudSyncReady = false;
let cloudSyncTimer = null;
let isCloudSyncing = false;
let hasPendingTimeSync = false;
let localUpdatedAt = localStorage.getItem(STORAGE_KEYS.updatedAt) || null;

// DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const statsBtn = document.getElementById('statsBtn');
const cloudSyncHeaderBtn = document.getElementById('cloudSyncHeaderBtn');
const cloudSyncDot = document.getElementById('cloudSyncDot');
const syllabusHeaderBtn = document.getElementById('syllabusHeaderBtn');

const gasUrlInput = document.getElementById('gasUrlInput');
const gasTokenInput = document.getElementById('gasTokenInput');
const testCloudSyncBtn = document.getElementById('testCloudSyncBtn');
const cloudSyncModalStatus = document.getElementById('cloudSyncModalStatus');
const openGasGuideBtn = document.getElementById('openGasGuideBtn');
const gasGuideModal = document.getElementById('gasGuideModal');
const closeGasGuideBtn = document.getElementById('closeGasGuideBtn');
const closeGasGuideFooterBtn = document.getElementById('closeGasGuideFooterBtn');
const copyGasCodeBtn = document.getElementById('copyGasCodeBtn');
const gasCodePreview = document.getElementById('gasCodePreview');
const statsCloudStatusText = document.getElementById('statsCloudStatusText');
const statsCloudPushBtn = document.getElementById('statsCloudPushBtn');
const statsCloudPullBtn = document.getElementById('statsCloudPullBtn');
const bookmarksHeaderBtn = document.getElementById('bookmarksHeaderBtn');
const apiGuideHeaderBtn = document.getElementById('apiGuideHeaderBtn');
const openApiGuideBtn = document.getElementById('openApiGuideBtn');
const apiModal = document.getElementById('apiModal');
const closeApiModalBtn = document.getElementById('closeApiModalBtn');
const apiGuideModal = document.getElementById('apiGuideModal');
const closeApiGuideBtn = document.getElementById('closeApiGuideBtn');
const closeApiGuideFooterBtn = document.getElementById('closeApiGuideFooterBtn');
const statsModal = document.getElementById('statsModal');
const versionBadge = document.getElementById('versionBadge');
const changelogModal = document.getElementById('changelogModal');
const closeChangelogBtn = document.getElementById('closeChangelogBtn');
const closeChangelogFooterBtn = document.getElementById('closeChangelogFooterBtn');
const changelogList = document.getElementById('changelogList');

// 3階層シラバス＆マップDOM
const subtopicSelect = document.getElementById('subtopicSelect');
const syllabusMiniBar = document.getElementById('syllabusMiniBar');
const syllabusMiniText = document.getElementById('syllabusMiniText');
const openSyllabusMapBtn = document.getElementById('openSyllabusMapBtn');
const syllabusMiniTiles = document.getElementById('syllabusMiniTiles');
const subtopicBadge = document.getElementById('subtopicBadge');
const syllabusModal = document.getElementById('syllabusModal');
const closeSyllabusBtn = document.getElementById('closeSyllabusBtn');
const closeSyllabusFooterBtn = document.getElementById('closeSyllabusFooterBtn');
const syllabusExamSelect = document.getElementById('syllabusExamSelect');
const syllabusCategoryFilter = document.getElementById('syllabusCategoryFilter');
const syllabusOverallTitle = document.getElementById('syllabusOverallTitle');
const syllabusOverallPercent = document.getElementById('syllabusOverallPercent');
const syllabusMasteredBar = document.getElementById('syllabusMasteredBar');
const syllabusLearningBar = document.getElementById('syllabusLearningBar');
const syllabusWeakBar = document.getElementById('syllabusWeakBar');
const countMastered = document.getElementById('countMastered');
const countLearning = document.getElementById('countLearning');
const countWeak = document.getElementById('countWeak');
const countUnstudied = document.getElementById('countUnstudied');
const weakSubtopicsList = document.getElementById('weakSubtopicsList');
const formatTendencySummary = document.getElementById('formatTendencySummary');
const unstudiedSubtopicsList = document.getElementById('unstudiedSubtopicsList');
const syllabusMapContainer = document.getElementById('syllabusMapContainer');

// ブックマーク・バックアップ関連DOM
const bookmarkModal = document.getElementById('bookmarkModal');
const closeBookmarkBtn = document.getElementById('closeBookmarkBtn');
const closeBookmarkFooterBtn = document.getElementById('closeBookmarkFooterBtn');
const bookmarkFilterExam = document.getElementById('bookmarkFilterExam');
const startBookmarkPracticeBtn = document.getElementById('startBookmarkPracticeBtn');
const bookmarkListContainer = document.getElementById('bookmarkListContainer');
const bookmarkModeBtn = document.getElementById('bookmarkModeBtn');
const bookmarkCountSpan = document.getElementById('bookmarkCount');
const bookmarkToggleBtn = document.getElementById('bookmarkToggleBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const importDataInput = document.getElementById('importDataInput');

const engineRadios = document.getElementsByName('aiEngine');
const geminiKeyGroup = document.getElementById('geminiKeyGroup');
const groqKeyGroup = document.getElementById('groqKeyGroup');
const openrouterKeyGroup = document.getElementById('openrouterKeyGroup');
const openaiKeyGroup = document.getElementById('openaiKeyGroup');
const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
const groqApiKeyInput = document.getElementById('groqApiKeyInput');
const openrouterApiKeyInput = document.getElementById('openrouterApiKeyInput');
const openaiApiKeyInput = document.getElementById('openaiApiKeyInput');
const saveApiBtn = document.getElementById('saveApiBtn');
const toast = document.getElementById('toast');

const examSelect = document.getElementById('examSelect');
const categorySelect = document.getElementById('categorySelect');
const formatSelect = document.getElementById('formatSelect');
const trickOptionCheckbox = document.getElementById('trickOptionCheckbox');
const searchGroundingCheckbox = document.getElementById('searchGroundingCheckbox');

const generateBtn = document.getElementById('generateBtn');
const reviewBtn = document.getElementById('reviewBtn');
const mistakeCountSpan = document.getElementById('mistakeCount');
const btnText = generateBtn ? generateBtn.querySelector('.btn-text') : null;
const spinner = generateBtn ? generateBtn.querySelector('.spinner') : null;

const skipBtn = document.getElementById('skipBtn');
const skipBtnText = skipBtn ? skipBtn.querySelector('.btn-text') : null;
const skipBtnSpinner = skipBtn ? skipBtn.querySelector('.spinner') : null;
const skipSameTopicBtn = document.getElementById('skipSameTopicBtn');
const skipSameTopicBtnText = skipSameTopicBtn ? skipSameTopicBtn.querySelector('.btn-text') : null;
const skipSameTopicBtnSpinner = skipSameTopicBtn ? skipSameTopicBtn.querySelector('.spinner') : null;

const quizSection = document.getElementById('quizSection');
const engineBadge = document.getElementById('engineBadge');
const sourceBadge = document.getElementById('sourceBadge');
const quizVisualContainer = document.getElementById('quizVisualContainer');
const questionText = document.getElementById('questionText');

// ○× & 危険予測 DOM
const tfContainer = document.getElementById('tfContainer');
const tfTrueBtn = document.getElementById('tfTrueBtn');
const tfFalseBtn = document.getElementById('tfFalseBtn');
const hazardContainer = document.getElementById('hazardContainer');
const hazardStatementsList = document.getElementById('hazardStatementsList');
const submitHazardBtn = document.getElementById('submitHazardBtn');

const resultSection = document.getElementById('resultSection');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const answerSummaryBanner = document.getElementById('answerSummaryBanner');
const explanationText = document.getElementById('explanationText');
const groundingInfoBox = document.getElementById('groundingInfoBox');
const groundingSourcesList = document.getElementById('groundingSourcesList');

// AI教官チャットDOM
const aiTutorSection = document.getElementById('aiTutorSection');
const tutorChatHistory = document.getElementById('tutorChatHistory');
const tutorInput = document.getElementById('tutorInput');
const tutorSendBtn = document.getElementById('tutorSendBtn');
const tutorChipBtns = document.querySelectorAll('.tutor-chip-btn');
const copyTutorNoteBtn = document.getElementById('copyTutorNoteBtn');
const downloadTutorMdBtn = document.getElementById('downloadTutorMdBtn');

const nextBtn = document.getElementById('nextBtn');
const nextBtnText = nextBtn ? nextBtn.querySelector('.btn-text') : null;
const nextBtnSpinner = nextBtn ? nextBtn.querySelector('.spinner') : null;
const ttsBtn = document.getElementById('ttsBtn');
const printBtn = document.getElementById('printBtn');
const ttsSpeed = document.getElementById('ttsSpeed');
const ttsSpeedVal = document.getElementById('ttsSpeedVal');

function hasConfiguredApiKey(engineOverride = null) {
    const eng = engineOverride || localStorage.getItem('ai_engine') || 'gemini';
    return Boolean((localStorage.getItem(`${eng}_api_key`) || '').trim());
}

function init() {
    const engine = localStorage.getItem('ai_engine') || 'gemini';
    const geminiKey = localStorage.getItem('gemini_api_key') || '';
    const groqKey = localStorage.getItem('groq_api_key') || '';
    const openrouterKey = localStorage.getItem('openrouter_api_key') || '';
    const openaiKey = localStorage.getItem('openai_api_key') || '';

    if (geminiApiKeyInput) geminiApiKeyInput.value = geminiKey;
    if (groqApiKeyInput) groqApiKeyInput.value = groqKey;
    if (openrouterApiKeyInput) openrouterApiKeyInput.value = openrouterKey;
    if (openaiApiKeyInput) openaiApiKeyInput.value = openaiKey;

    engineRadios.forEach(r => {
        if (r.value === engine) r.checked = true;
        r.addEventListener('change', updateApiModalUI);
    });
    updateApiModalUI();

    // ※精査済み問題バンクはAPIキー不要ですぐ解けるため、起動時にapiModalを強制表示しない
    updateCategories();
    renderStats();
    updateReviewBtnState();
    updateBookmarkBtnState();

    // Modal & Header Event Listeners
    if (settingsBtn) settingsBtn.addEventListener('click', () => apiModal.classList.remove('hidden'));
    if (closeApiModalBtn) closeApiModalBtn.addEventListener('click', () => apiModal.classList.add('hidden'));

    const openApiGuide = () => {
        if (!apiGuideModal) return;
        apiGuideModal.classList.remove('hidden');
        const guideBody = apiGuideModal.querySelector('.stats-modal-body');
        if (guideBody) guideBody.scrollTop = 0;
    };
    if (apiGuideHeaderBtn) apiGuideHeaderBtn.addEventListener('click', openApiGuide);
    if (openApiGuideBtn) openApiGuideBtn.addEventListener('click', openApiGuide);
    if (closeApiGuideBtn) closeApiGuideBtn.addEventListener('click', () => apiGuideModal.classList.add('hidden'));
    if (closeApiGuideFooterBtn) closeApiGuideFooterBtn.addEventListener('click', () => apiGuideModal.classList.add('hidden'));
    if (apiGuideModal) {
        apiGuideModal.addEventListener('click', (e) => {
            if (e.target === apiGuideModal) apiGuideModal.classList.add('hidden');
        });
    }

    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            renderStats();
            statsModal.classList.remove('hidden');
            const statsBody = statsModal.querySelector('.stats-modal-body');
            if (statsBody) statsBody.scrollTop = 0;
        });
    }
    const closeStatsBtn = document.getElementById('closeStatsBtn');
    if (closeStatsBtn) closeStatsBtn.addEventListener('click', () => statsModal.classList.add('hidden'));

    const handleOpenSyllabus = () => openSyllabusModal();
    if (syllabusHeaderBtn) syllabusHeaderBtn.addEventListener('click', handleOpenSyllabus);
    if (openSyllabusMapBtn) openSyllabusMapBtn.addEventListener('click', handleOpenSyllabus);
    if (closeSyllabusBtn) closeSyllabusBtn.addEventListener('click', () => syllabusModal.classList.add('hidden'));
    if (closeSyllabusFooterBtn) closeSyllabusFooterBtn.addEventListener('click', () => syllabusModal.classList.add('hidden'));
    if (syllabusModal) {
        syllabusModal.addEventListener('click', (e) => {
            if (e.target === syllabusModal) syllabusModal.classList.add('hidden');
        });
    }
    if (syllabusExamSelect) {
        syllabusExamSelect.addEventListener('change', () => {
            populateSyllabusCategoryFilter(syllabusExamSelect.value);
            renderSyllabusModal();
        });
    }
    if (syllabusCategoryFilter) {
        syllabusCategoryFilter.addEventListener('change', () => renderSyllabusModal());
    }

    // キーボード操作（Escでモーダル閉じ、○×のショートカット）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [gasGuideModal, syllabusModal, apiGuideModal, statsModal, bookmarkModal, changelogModal, apiModal].forEach(m => {
                if (m && !m.classList.contains('hidden')) {
                    m.classList.add('hidden');
                }
            });
            return;
        }

        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
        const anyModalOpen = [gasGuideModal, syllabusModal, apiGuideModal, statsModal, bookmarkModal, changelogModal, apiModal]
            .some(m => m && !m.classList.contains('hidden'));
        if (anyModalOpen) return;

        if (!currentQuiz || quizSection.classList.contains('hidden')) return;

        if (currentQuiz.type === 'tf' && !isCurrentQuizAnswered) {
            const k = e.key.toLowerCase();
            if (k === 'o' || e.key === '1' || e.key === 'ArrowLeft') {
                e.preventDefault();
                handleTfAnswer(true);
            } else if (k === 'x' || e.key === '2' || e.key === 'ArrowRight') {
                e.preventDefault();
                handleTfAnswer(false);
            }
        } else if (isCurrentQuizAnswered && e.key === 'Enter' && nextBtn && !nextBtn.disabled) {
            e.preventDefault();
            nextBtn.click();
        }
    });

    initCloudSyncUI();

    // Bookmark Listeners
    if (bookmarksHeaderBtn) bookmarksHeaderBtn.addEventListener('click', openBookmarkModal);
    if (bookmarkModeBtn) bookmarkModeBtn.addEventListener('click', openBookmarkModal);
    if (closeBookmarkBtn) closeBookmarkBtn.addEventListener('click', () => bookmarkModal.classList.add('hidden'));
    if (closeBookmarkFooterBtn) closeBookmarkFooterBtn.addEventListener('click', () => bookmarkModal.classList.add('hidden'));
    if (bookmarkModal) {
        bookmarkModal.addEventListener('click', (e) => {
            if (e.target === bookmarkModal) bookmarkModal.classList.add('hidden');
        });
    }
    if (bookmarkFilterExam) bookmarkFilterExam.addEventListener('change', renderBookmarkList);
    if (startBookmarkPracticeBtn) startBookmarkPracticeBtn.addEventListener('click', startBookmarkPractice);
    if (bookmarkToggleBtn) bookmarkToggleBtn.addEventListener('click', toggleCurrentQuizBookmark);

    if (copyTutorNoteBtn) copyTutorNoteBtn.addEventListener('click', copyStudyNoteToClipboard);
    if (downloadTutorMdBtn) downloadTutorMdBtn.addEventListener('click', downloadStudyNoteMarkdown);

    // Backup & Restore Listeners
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportAllData);
    if (importDataBtn && importDataInput) {
        importDataBtn.addEventListener('click', () => importDataInput.click());
        importDataInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                importAllData(file);
                importDataInput.value = '';
            }
        });
    }

    // Changelog Modal Listeners
    if (versionBadge) {
        versionBadge.addEventListener('click', () => {
            renderChangelog();
            changelogModal.classList.remove('hidden');
        });
    }
    if (closeChangelogBtn) closeChangelogBtn.addEventListener('click', () => changelogModal.classList.add('hidden'));
    if (closeChangelogFooterBtn) closeChangelogFooterBtn.addEventListener('click', () => changelogModal.classList.add('hidden'));
    if (changelogModal) {
        changelogModal.addEventListener('click', (e) => {
            if (e.target === changelogModal) changelogModal.classList.add('hidden');
        });
    }

    // ○× 解答リスナー & 危険予測3連○×送信リスナー
    if (tfTrueBtn) tfTrueBtn.addEventListener('click', () => handleTfAnswer(true));
    if (tfFalseBtn) tfFalseBtn.addEventListener('click', () => handleTfAnswer(false));
    if (submitHazardBtn) submitHazardBtn.addEventListener('click', handleHazardSubmit);

    // AI教官チャットリスナー
    if (tutorSendBtn) {
        tutorSendBtn.addEventListener('click', () => {
            if (tutorInput && tutorInput.value.trim()) {
                handleTutorQuestion(tutorInput.value.trim());
            }
        });
    }
    if (tutorInput) {
        tutorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tutorInput.value.trim()) {
                handleTutorQuestion(tutorInput.value.trim());
            }
        });
    }
    if (tutorChipBtns && tutorChipBtns.length > 0) {
        tutorChipBtns.forEach(chip => {
            chip.addEventListener('click', () => {
                const promptText = chip.getAttribute('data-prompt');
                if (promptText) handleTutorQuestion(promptText);
            });
        });
    }

    const resetStatsBtn = document.getElementById('resetStatsBtn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            if (confirm('今までの統計データ（シラバス網羅状況を含む）と「間違えた問題ストック」をリセットしますか？\n（※保存済みのブックマークは保持されます）')) {
                stats = normalizeStatsObject({});
                mistakes = [];
                bankSeenIds = [];
                localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
                localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify(mistakes));
                localStorage.setItem(STORAGE_KEYS.bankSeen, JSON.stringify(bankSeenIds));
                renderStats();
                updateSubtopicsUI();
                renderSyllabusMiniBar();
                updateReviewBtnState();
                markLocalDataUpdated(true);
                showToast('統計データと復習ストックをリセットしました');
            }
        });
    }

    if (saveApiBtn) saveApiBtn.addEventListener('click', saveApiSettings);
    if (examSelect) {
        examSelect.addEventListener('change', () => {
            updateCategories();
            cancelBackgroundPrefetch();
        });
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            currentCategory = categorySelect.value;
            updateSubtopicsUI();
            renderSyllabusMiniBar();
            cancelBackgroundPrefetch();
        });
    }
    if (subtopicSelect) {
        subtopicSelect.addEventListener('change', () => {
            renderSyllabusMiniBar();
            cancelBackgroundPrefetch();
        });
    }
    if (formatSelect) formatSelect.addEventListener('change', () => cancelBackgroundPrefetch());
    if (trickOptionCheckbox) trickOptionCheckbox.addEventListener('change', () => cancelBackgroundPrefetch());
    if (searchGroundingCheckbox) searchGroundingCheckbox.addEventListener('change', () => cancelBackgroundPrefetch());

    // 新規問題を出題ボタン
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            stopSpeaking();
            cancelBackgroundPrefetch();
            isReviewMode = false;
            isBookmarkMode = false;
            setLoading(true);
            quizSection.classList.add('hidden');
            resultSection.classList.add('hidden');

            try {
                const data = await fetchQuizData();
                displayQuiz(data);
            } catch (e) {
                console.error('[DriveGenius Error]', e);
                showToast(formatUserErrorMessage(e));
            } finally {
                setLoading(false);
            }
        });
    }

    // 復習モードボタン
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            stopSpeaking();
            cancelBackgroundPrefetch();
            if (mistakes.length === 0) return;
            isReviewMode = true;
            isBookmarkMode = false;
            quizSection.classList.add('hidden');
            resultSection.classList.add('hidden');

            const randomIndex = Math.floor(Math.random() * mistakes.length);
            const reviewQuiz = mistakes[randomIndex];
            reviewQuiz.mistakeIndex = randomIndex;
            displayQuiz(reviewQuiz);
        });
    }

    // 次の問題へボタン
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            stopSpeaking();
            if (isReviewMode) {
                reviewBtn.click();
                return;
            }
            if (isBookmarkMode) {
                startBookmarkPractice();
                return;
            }
            if (prefetchTimer) {
                clearTimeout(prefetchTimer);
                prefetchTimer = null;
            }
            if (!nextQuizPromise) {
                nextQuizPromise = fetchQuizData({
                    excludeQuestionId: currentQuiz ? currentQuiz.id : null,
                    avoidQuestionText: currentQuiz ? currentQuiz.question : null
                });
            }

            setNextBtnLoading(true);
            try {
                const data = await nextQuizPromise;
                nextQuizPromise = null;
                resultSection.classList.add('hidden');
                quizSection.classList.add('hidden');
                displayQuiz(data);
            } catch (e) {
                console.error('[DriveGenius Next Error]', e);
                showToast(formatUserErrorMessage(e));
                nextQuizPromise = null;
            } finally {
                setNextBtnLoading(false);
            }
        });
    }

    // 別テーマへスキップ
    if (skipBtn) {
        skipBtn.addEventListener('click', async () => {
            stopSpeaking();
            cancelBackgroundPrefetch();
            if (isReviewMode) { reviewBtn.click(); return; }
            if (isBookmarkMode) { startBookmarkPractice(); return; }

            const excludedSub = currentQuiz && currentQuiz.subtopic ? currentQuiz.subtopic : null;
            skipBtn.disabled = true;
            if (skipSameTopicBtn) skipSameTopicBtn.disabled = true;
            if (skipBtnText) skipBtnText.classList.add('hidden');
            if (skipBtnSpinner) skipBtnSpinner.classList.remove('hidden');

            try {
                const data = await fetchQuizData({
                    excludeSubtopic: excludedSub,
                    excludeQuestionId: currentQuiz ? currentQuiz.id : null,
                    avoidQuestionText: currentQuiz ? currentQuiz.question : null
                });
                resultSection.classList.add('hidden');
                displayQuiz(data);
                if (excludedSub && data.subtopic && data.subtopic !== excludedSub) {
                    showToast(`⏭️ 「${data.subtopic}」へテーマを切り替えました`);
                }
            } catch (e) {
                console.error('[DriveGenius Skip Error]', e);
                showToast(formatUserErrorMessage(e));
            } finally {
                skipBtn.disabled = false;
                if (skipSameTopicBtn) skipSameTopicBtn.disabled = false;
                if (skipBtnText) skipBtnText.classList.remove('hidden');
                if (skipBtnSpinner) skipBtnSpinner.classList.add('hidden');
            }
        });
    }

    // 同じ論点で別問題に切替
    if (skipSameTopicBtn) {
        skipSameTopicBtn.addEventListener('click', async () => {
            stopSpeaking();
            cancelBackgroundPrefetch();
            if (isReviewMode) { reviewBtn.click(); return; }
            if (isBookmarkMode) { startBookmarkPractice(); return; }

            const targetSub = currentQuiz && currentQuiz.subtopic ? currentQuiz.subtopic : null;
            skipSameTopicBtn.disabled = true;
            if (skipBtn) skipBtn.disabled = true;
            if (skipSameTopicBtnText) skipSameTopicBtnText.classList.add('hidden');
            if (skipSameTopicBtnSpinner) skipSameTopicBtnSpinner.classList.remove('hidden');

            try {
                const data = await fetchQuizData({
                    forceSubtopic: targetSub,
                    excludeQuestionId: currentQuiz ? currentQuiz.id : null,
                    avoidQuestionText: currentQuiz ? currentQuiz.question : null
                });
                resultSection.classList.add('hidden');
                displayQuiz(data);
                if (data.subtopic) {
                    showToast(`🔄 「${data.subtopic}」の別問題に切り替えました`);
                }
            } catch (e) {
                console.error('[DriveGenius Skip Same Topic Error]', e);
                showToast(formatUserErrorMessage(e));
            } finally {
                skipSameTopicBtn.disabled = false;
                if (skipBtn) skipBtn.disabled = false;
                if (skipSameTopicBtnText) skipSameTopicBtnText.classList.remove('hidden');
                if (skipSameTopicBtnSpinner) skipSameTopicBtnSpinner.classList.add('hidden');
            }
        });
    }

    [apiModal, statsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    });

    if (ttsBtn) {
        ttsBtn.addEventListener('click', () => {
            if (isSpeaking) stopSpeaking();
            else startSpeaking();
        });
    }
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    if (ttsSpeed) {
        ttsSpeed.addEventListener('input', () => {
            const speed = parseFloat(ttsSpeed.value).toFixed(1);
            if (ttsSpeedVal) ttsSpeedVal.textContent = `${speed}x`;
        });
        ttsSpeed.addEventListener('change', () => {
            if (isSpeaking) startSpeaking();
        });
    }

    setInterval(() => {
        sessionSeconds++;
        updateTodayStudyTimeData();
    }, 1000);
}

function updateReviewBtnState() {
    if (!mistakeCountSpan || !reviewBtn) return;
    mistakeCountSpan.textContent = mistakes.length;
    reviewBtn.disabled = mistakes.length === 0;
}

function updateBookmarkBtnState() {
    if (bookmarkCountSpan) bookmarkCountSpan.textContent = bookmarks.length;
    if (bookmarkModeBtn) bookmarkModeBtn.disabled = false;
    updateBookmarkToggleUI();
}

function updateApiModalUI() {
    const selectedRadio = Array.from(engineRadios).find(r => r.checked);
    const selectedEngine = selectedRadio ? selectedRadio.value : 'gemini';
    if (geminiKeyGroup) geminiKeyGroup.classList.toggle('hidden', selectedEngine !== 'gemini');
    if (groqKeyGroup) groqKeyGroup.classList.toggle('hidden', selectedEngine !== 'groq');
    if (openrouterKeyGroup) openrouterKeyGroup.classList.toggle('hidden', selectedEngine !== 'openrouter');
    if (openaiKeyGroup) openaiKeyGroup.classList.toggle('hidden', selectedEngine !== 'openai');
}

function saveApiSettings() {
    const selectedRadio = Array.from(engineRadios).find(r => r.checked);
    const selectedEngine = selectedRadio ? selectedRadio.value : 'gemini';
    const gKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
    const groqKey = groqApiKeyInput ? groqApiKeyInput.value.trim() : '';
    const openrouterKey = openrouterApiKeyInput ? openrouterApiKeyInput.value.trim() : '';
    const oKey = openaiApiKeyInput ? openaiApiKeyInput.value.trim() : '';

    localStorage.setItem('ai_engine', selectedEngine);
    if (gKey) localStorage.setItem('gemini_api_key', gKey);
    if (groqKey) localStorage.setItem('groq_api_key', groqKey);
    if (openrouterKey) localStorage.setItem('openrouter_api_key', openrouterKey);
    if (oKey) localStorage.setItem('openai_api_key', oKey);

    const prevCfg = getCloudSyncConfig();
    const newGasUrl = gasUrlInput ? gasUrlInput.value.trim() : '';
    const newGasToken = gasTokenInput ? gasTokenInput.value.trim() : '';
    localStorage.setItem(STORAGE_KEYS.gasUrl, newGasUrl);
    localStorage.setItem(STORAGE_KEYS.gasToken, newGasToken);

    apiModal.classList.add('hidden');
    showToast('設定を保存しました');

    if (newGasUrl && newGasToken) {
        if (newGasUrl !== prevCfg.url || newGasToken !== prevCfg.token || !cloudSyncReady) {
            syncCloudOnStartup(true);
        }
    } else {
        cloudSyncReady = false;
        setCloudSyncStatus('off', '未設定');
    }
}

function updateFormatSelectUI() {
    if (!formatSelect) return;
    const examConfig = EXAM_DATA[examSelect.value];
    const fmtType = examConfig ? examConfig.formatType : 'honmen_full';

    const hybridOpt = formatSelect.querySelector('option[value="hybrid"]');
    const bankOpt = formatSelect.querySelector('option[value="bank"]');
    const aiTfOpt = formatSelect.querySelector('option[value="ai_tf"]');
    const aiHazardOpt = formatSelect.querySelector('option[value="ai_hazard"]');

    if (fmtType === 'hazard_only') {
        if (hybridOpt) hybridOpt.textContent = '🛡️ ハイブリッド（危険予測10シーン＋AI生成）';
        if (bankOpt) bankOpt.textContent = '📚 精査済み危険予測バンクのみ（10問・API不要）';
        if (aiTfOpt) aiTfOpt.textContent = '🤖 AI生成：単問○×（この場面の個別確認）';
        if (aiHazardOpt) aiHazardOpt.textContent = '🤖 AI生成：危険予測3連○×（2点）';
        if (formatSelect.value === 'ai_tf') formatSelect.value = 'hybrid';
    } else if (fmtType === 'sign_tf') {
        if (hybridOpt) hybridOpt.textContent = '🛡️ ハイブリッド（標識SVGバンク＋AI類題）';
        if (bankOpt) bankOpt.textContent = '📚 精査済み標識SVGバンクのみ（18問・API不要）';
        if (aiTfOpt) aiTfOpt.textContent = '🤖 AI生成：標識・標示○×（SVG連動）';
        if (aiHazardOpt) aiHazardOpt.textContent = '🤖 AI生成：危険予測3連○×（2点）';
    } else {
        if (hybridOpt) hybridOpt.textContent = '🛡️ ハイブリッド（精査済みバンク優先＋AI類題生成）';
        if (bankOpt) bankOpt.textContent = '📚 精査済み問題バンクのみ（APIキー不要・確実）';
        if (aiTfOpt) aiTfOpt.textContent = '🤖 AI生成：○×問題（1点）';
        if (aiHazardOpt) aiHazardOpt.textContent = '🤖 AI生成：危険予測3連○×（2点）';
    }
}

function updateCategories() {
    currentExam = examSelect.value;
    const categories = (EXAM_DATA[currentExam] && EXAM_DATA[currentExam].categories) || [];

    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
    currentCategory = categorySelect.value;

    updateFormatSelectUI();
    updateSubtopicsUI();
    renderSyllabusMiniBar();
}

// ==========================================================================
// 3階層シラバス管理・小分類スマート抽選・ミニ進捗バー
// ==========================================================================

function getSubtopicsForCategory(exam, category) {
    if (SYLLABUS_DATA[exam] && Array.isArray(SYLLABUS_DATA[exam][category])) {
        return SYLLABUS_DATA[exam][category];
    }
    return [];
}

function getSubtopicKey(exam, category, subtopic) {
    return `${exam}::${category}::${subtopic}`;
}

function getSubtopicRecord(exam, category, subtopic) {
    if (!stats.subtopics) stats.subtopics = {};
    const key = getSubtopicKey(exam, category, subtopic);
    return stats.subtopics[key] || { total: 0, correct: 0, lastAt: null };
}

function getSubtopicState(exam, category, subtopic) {
    const rec = getSubtopicRecord(exam, category, subtopic);
    if (!rec || rec.total === 0) return 'unstudied';
    const acc = (rec.correct / rec.total) * 100;
    if (acc < 50) return 'weak';
    if (rec.total >= 2 && acc >= 80) return 'mastered';
    return 'learning';
}

function getSubtopicStateSymbol(state) {
    if (state === 'mastered') return '🟩';
    if (state === 'weak') return '🟥';
    if (state === 'learning') return '🟨';
    return '⬜';
}

function updateSubtopicsUI(preserveSelection = false) {
    if (!subtopicSelect) return;
    const prevValue = preserveSelection ? subtopicSelect.value : 'mode_coverage';
    const exam = examSelect.value;
    const category = categorySelect.value;
    const subtopics = getSubtopicsForCategory(exam, category);

    subtopicSelect.innerHTML = '';

    const modeOptions = [
        { value: 'mode_coverage', text: '🗺️ おまかせ：未学習・手薄な論点を優先（網羅モード）' },
        { value: 'mode_weak', text: '🎯 おまかせ：苦手・誤答が多い論点を優先（弱点特化モード）' },
        { value: 'mode_random', text: '🎲 おまかせ：分野内から完全ランダム（重複回避）' }
    ];
    modeOptions.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.text;
        subtopicSelect.appendChild(opt);
    });

    if (subtopics.length > 0) {
        const sep = document.createElement('option');
        sep.disabled = true;
        sep.textContent = '──────── 📌 個別の小分類（重要論点）を指定 ────────';
        subtopicSelect.appendChild(sep);

        subtopics.forEach((sub, idx) => {
            const rec = getSubtopicRecord(exam, category, sub);
            const state = getSubtopicState(exam, category, sub);
            const sym = getSubtopicStateSymbol(state);
            const statSuffix = rec.total > 0
                ? ` (${Math.round((rec.correct / rec.total) * 100)}% - ${rec.correct}/${rec.total}問)`
                : ' (未学習)';
            const opt = document.createElement('option');
            opt.value = `subtopic::${idx}`;
            opt.textContent = `${sym} ${idx + 1}. ${sub}${statSuffix}`;
            subtopicSelect.appendChild(opt);
        });
    }

    const canRestore = Array.from(subtopicSelect.options).some(o => o.value === prevValue && !o.disabled);
    subtopicSelect.value = canRestore ? prevValue : 'mode_coverage';
}

function renderSyllabusMiniBar() {
    if (!syllabusMiniBar || !syllabusMiniText || !syllabusMiniTiles) return;
    const exam = examSelect.value;
    const category = categorySelect.value;
    const subtopics = getSubtopicsForCategory(exam, category);

    if (subtopics.length === 0) {
        syllabusMiniBar.classList.add('hidden');
        return;
    }
    syllabusMiniBar.classList.remove('hidden');

    let touchedCount = 0;
    let masteredCount = 0;
    syllabusMiniTiles.innerHTML = '';

    const selectedVal = subtopicSelect ? subtopicSelect.value : 'mode_coverage';

    subtopics.forEach((sub, idx) => {
        const state = getSubtopicState(exam, category, sub);
        const rec = getSubtopicRecord(exam, category, sub);
        if (state !== 'unstudied') touchedCount++;
        if (state === 'mastered') masteredCount++;

        const tile = document.createElement('span');
        const isCurrentSelected = selectedVal === `subtopic::${idx}`;
        tile.className = `mini-tile state-${state}${isCurrentSelected ? ' active-selected' : ''}`;
        const accText = rec.total > 0 ? `正答率 ${Math.round((rec.correct / rec.total) * 100)}% (${rec.correct}/${rec.total}問)` : '未学習 (クリックでこの論点を選択)';
        tile.title = `${idx + 1}. ${sub} — ${accText}`;
        tile.addEventListener('click', () => {
            if (subtopicSelect) {
                subtopicSelect.value = `subtopic::${idx}`;
                renderSyllabusMiniBar();
                cancelBackgroundPrefetch();
                showToast(`📌 出題論点を「${sub}」に設定しました`);
            }
        });
        syllabusMiniTiles.appendChild(tile);
    });

    const pct = Math.round((touchedCount / subtopics.length) * 100);
    syllabusMiniText.textContent = `📊 この分野の網羅率: ${touchedCount}/${subtopics.length}論点 (${pct}%) ｜ 🟩マスター: ${masteredCount}`;
}

function pickSubtopicForQuiz(exam, category, options = {}) {
    const { excludeSubtopic = null, forceSubtopic = null } = options;
    const subtopics = getSubtopicsForCategory(exam, category);
    if (subtopics.length === 0) return '';

    if (forceSubtopic && subtopics.includes(forceSubtopic)) {
        return forceSubtopic;
    }

    const modeOrVal = subtopicSelect ? subtopicSelect.value : 'mode_coverage';
    if (modeOrVal && modeOrVal.startsWith('subtopic::')) {
        const idx = parseInt(modeOrVal.split('::')[1], 10);
        const manualSub = subtopics[idx];
        if (manualSub && manualSub !== excludeSubtopic) {
            return manualSub;
        }
    }

    let pool = subtopics.filter(s => s !== excludeSubtopic);
    if (pool.length === 0) pool = [...subtopics];

    const nonRecentPool = pool.filter(s => !recentSubtopics.includes(s));
    const candidatePool = nonRecentPool.length > 0 ? nonRecentPool : pool;

    if (modeOrVal === 'mode_weak') {
        const weakList = candidatePool.filter(s => getSubtopicState(exam, category, s) === 'weak');
        if (weakList.length > 0) return weakList[Math.floor(Math.random() * weakList.length)];
        const learningList = candidatePool
            .filter(s => getSubtopicState(exam, category, s) === 'learning')
            .sort((a, b) => {
                const ra = getSubtopicRecord(exam, category, a);
                const rb = getSubtopicRecord(exam, category, b);
                return (ra.correct / ra.total) - (rb.correct / rb.total);
            });
        if (learningList.length > 0) return learningList[0];
        const unstudiedList = candidatePool.filter(s => getSubtopicState(exam, category, s) === 'unstudied');
        if (unstudiedList.length > 0) return unstudiedList[Math.floor(Math.random() * unstudiedList.length)];
    } else if (modeOrVal === 'mode_coverage') {
        const unstudiedList = candidatePool.filter(s => getSubtopicState(exam, category, s) === 'unstudied');
        if (unstudiedList.length > 0) return unstudiedList[Math.floor(Math.random() * unstudiedList.length)];
        const weakList = candidatePool.filter(s => getSubtopicState(exam, category, s) === 'weak');
        if (weakList.length > 0) return weakList[Math.floor(Math.random() * weakList.length)];
        const learningList = candidatePool
            .filter(s => getSubtopicState(exam, category, s) === 'learning')
            .sort((a, b) => getSubtopicRecord(exam, category, a).total - getSubtopicRecord(exam, category, b).total);
        if (learningList.length > 0) return learningList[0];
    }

    return candidatePool[Math.floor(Math.random() * candidatePool.length)];
}

function recordRecentSubtopic(subtopic) {
    if (!subtopic) return;
    recentSubtopics = recentSubtopics.filter(s => s !== subtopic);
    recentSubtopics.push(subtopic);
    if (recentSubtopics.length > 5) recentSubtopics.shift();
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3200);
}

function setLoading(isLoading) {
    if (!generateBtn) return;
    generateBtn.disabled = isLoading;
    if (isLoading) {
        if (btnText) btnText.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    } else {
        if (btnText) btnText.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
    }
}

function setNextBtnLoading(isLoading) {
    if (!nextBtn) return;
    nextBtn.disabled = isLoading;
    if (isLoading) {
        if (nextBtnText) nextBtnText.classList.add('hidden');
        if (nextBtnSpinner) nextBtnSpinner.classList.remove('hidden');
    } else {
        if (nextBtnText) nextBtnText.classList.remove('hidden');
        if (nextBtnSpinner) nextBtnSpinner.classList.add('hidden');
    }
}

function cancelBackgroundPrefetch() {
    if (prefetchTimer) {
        clearTimeout(prefetchTimer);
        prefetchTimer = null;
    }
    nextQuizPromise = null;
}

function scheduleBackgroundPrefetch() {
    cancelBackgroundPrefetch();
    // 精査バンク利用時はミリ秒で取得できるため、AI生成時のみ先読みを行う
    const selectedFormat = formatSelect ? formatSelect.value : 'hybrid';
    if (selectedFormat === 'bank') return;
    if (selectedFormat === 'hybrid' && !hasConfiguredApiKey()) return;

    prefetchTimer = setTimeout(() => {
        prefetchTimer = null;
        if (!isReviewMode && !isBookmarkMode && !nextQuizPromise) {
            nextQuizPromise = fetchQuizData({
                isPrefetch: true,
                excludeQuestionId: currentQuiz ? currentQuiz.id : null
            }).catch(e => {
                console.warn('Background prefetch skipped/failed:', e.message);
                nextQuizPromise = null;
            });
        }
    }, 1800);
}

// ==========================================================================
// 精査済み問題バンク ピッカー (API不要・ハルシネーションゼロ)
// ==========================================================================

function getCuratedPoolForScope(exam, category) {
    if (!CURATED_QUESTION_BANK.length) return [];

    // 1. 完全一致 (exam + category)
    let pool = CURATED_QUESTION_BANK.filter(q => q.exam === exam && q.category === category);

    // 2. 本免・仮免の「信号・標識」カテゴリなら道路標識SVGバンク問題も合流させる
    if ((exam === 'honmen' || exam === 'karimen') && category.includes('標識')) {
        const signItems = CURATED_QUESTION_BANK.filter(q => q.exam === 'signs');
        pool = pool.concat(signItems);
    }

    // 3. 本免の「危険予測・悪条件」カテゴリなら危険予測イラスト問題も合流可能
    if (exam === 'honmen' && category.includes('危険予測')) {
        const hazardItems = CURATED_QUESTION_BANK.filter(q => q.exam === 'hazard');
        pool = pool.concat(hazardItems);
    }

    // 4. 仮免の各カテゴリで問題数が少ない場合は、本免の基本○×の同系統論点からも補完できるようフォールバック
    if (pool.length === 0 && exam === 'karimen') {
        pool = CURATED_QUESTION_BANK.filter(q => q.exam === 'honmen' && q.type === 'tf' && (
            (category.includes('信号') && q.category.includes('信号')) ||
            (category.includes('通行') && q.category.includes('通行区分')) ||
            (category.includes('交差点') && q.category.includes('交差点')) ||
            (category.includes('速度') && q.category.includes('速度')) ||
            (category.includes('合図') && q.category.includes('駐車'))
        ));
    }

    if (pool.length === 0) {
        pool = CURATED_QUESTION_BANK.filter(q => q.exam === exam);
    }
    return pool;
}

function pickCuratedQuestion(exam, category, targetSubtopic, options = {}) {
    const {
        isTrickMode = false,
        excludeSubtopic = null,
        excludeQuestionId = null,
        allowReset = true
    } = options;

    let pool = getCuratedPoolForScope(exam, category);
    if (pool.length === 0) return null;

    if (excludeQuestionId && pool.length > 1) {
        pool = pool.filter(q => q.id !== excludeQuestionId);
    }
    if (excludeSubtopic) {
        const subFiltered = pool.filter(q => q.subtopic !== excludeSubtopic);
        if (subFiltered.length > 0) pool = subFiltered;
    }

    // 未出題フィルタ
    let unseen = pool.filter(q => !bankSeenIds.includes(q.id));
    if (unseen.length === 0) {
        if (!allowReset) return null;
        // この範囲のバンクを一巡した場合は該当スコープの既出履歴をクリアして再巡回
        const poolIds = new Set(pool.map(q => q.id));
        bankSeenIds = bankSeenIds.filter(id => !poolIds.has(id));
        localStorage.setItem(STORAGE_KEYS.bankSeen, JSON.stringify(bankSeenIds));
        unseen = pool;
        showToast('📚 この分野の精査済み問題バンクを一巡しました（最初から再出題します）');
    }

    // 論点指定・スマート抽選された subtopic と一致する問題を優先
    let candidates = unseen;
    if (targetSubtopic) {
        const exactSub = unseen.filter(q => q.subtopic === targetSubtopic);
        if (exactSub.length > 0) {
            candidates = exactSub;
        }
    }

    if (isTrickMode) {
        const trickOnly = candidates.filter(q => q.isTrick);
        if (trickOnly.length > 0) candidates = trickOnly;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    if (!picked) return null;

    if (!bankSeenIds.includes(picked.id)) {
        bankSeenIds.push(picked.id);
        localStorage.setItem(STORAGE_KEYS.bankSeen, JSON.stringify(bankSeenIds));
    }

    // 元オブジェクトを破壊しないようディープコピーし、現在の選択コース/分野をメタ情報に反映
    const cloned = JSON.parse(JSON.stringify(picked));
    cloned.bankExam = picked.exam;
    cloned.exam = exam;
    cloned.category = category;
    if (!cloned.subtopic || (exam !== picked.exam && targetSubtopic)) {
        cloned.subtopic = targetSubtopic || cloned.subtopic || '';
    }
    cloned.source = 'bank';
    return cloned;
}

// ==========================================================================
// ハイブリッド出題＆AI問題生成エンジン
// ==========================================================================

async function fetchQuizData(fetchOptions = {}) {
    const {
        isPrefetch = false,
        excludeSubtopic = null,
        forceSubtopic = null,
        excludeQuestionId = null,
        avoidQuestionText = null
    } = fetchOptions;

    currentExam = examSelect.value;
    currentCategory = categorySelect.value;
    const isTrickMode = Boolean(trickOptionCheckbox && trickOptionCheckbox.checked);
    const selectedFormat = formatSelect ? formatSelect.value : 'hybrid';
    const examConfig = EXAM_DATA[currentExam] || { name: '普通免許 学科試験', formatType: 'honmen_full' };
    const examName = examConfig.name;

    const targetSubtopic = pickSubtopicForQuiz(currentExam, currentCategory, { excludeSubtopic, forceSubtopic });
    recordRecentSubtopic(targetSubtopic);

    // 1. 「精査済み問題バンクのみ」または「ハイブリッド（未出題バンク優先）」の判定
    if (selectedFormat === 'bank') {
        const bankQuiz = pickCuratedQuestion(currentExam, currentCategory, targetSubtopic, {
            isTrickMode,
            excludeSubtopic,
            excludeQuestionId,
            allowReset: true
        });
        if (bankQuiz) {
            return bankQuiz;
        }
    }

    if (selectedFormat === 'hybrid') {
        const hasKey = hasConfiguredApiKey();
        // ハイブリッド時：APIキーがある場合は未出題バンクを優先、一巡したらAI生成へシームレス移行
        // APIキーがない場合はバンクを循環して動作
        const bankQuiz = pickCuratedQuestion(currentExam, currentCategory, targetSubtopic, {
            isTrickMode,
            excludeSubtopic,
            excludeQuestionId,
            allowReset: !hasKey
        });
        if (bankQuiz) {
            return bankQuiz;
        }
        if (!hasKey) {
            throw new Error('BANK_EXHAUSTED_NO_KEY');
        }
    }

    // 2. AI生成パス
    const engine = localStorage.getItem('ai_engine') || 'gemini';
    const apiKey = (localStorage.getItem(`${engine}_api_key`) || '').trim();
    if (!apiKey) {
        if (apiModal) apiModal.classList.remove('hidden');
        throw new Error('API Key missing');
    }

    const useSearchGrounding = Boolean(searchGroundingCheckbox && searchGroundingCheckbox.checked && engine === 'gemini');
    const isHazardMode = selectedFormat === 'ai_hazard' || (selectedFormat === 'hybrid' && examConfig.formatType === 'hazard_only');
    const isSignMode = examConfig.formatType === 'sign_tf' || (currentCategory.includes('標識') && !isHazardMode);

    const excludedRecentList = recentSubtopics.filter(s => s && s !== targetSubtopic);
    if (excludeSubtopic && excludeSubtopic !== targetSubtopic && !excludedRecentList.includes(excludeSubtopic)) {
        excludedRecentList.push(excludeSubtopic);
    }

    const signListText = Object.values(ROAD_SIGNS)
        .map(s => `- "${s.id}": ${s.name}（${s.category}）`)
        .join('\n');
    const hazardListText = Object.values(HAZARD_SCENES)
        .map(h => `- "${h.id}": ${h.title}（${h.speed}） / 状況: ${h.situation}`)
        .join('\n');

    let subtopicInstruction = '';
    if (targetSubtopic) {
        subtopicInstruction = `\n【今回の重点出題テーマ（小分類・論点）】\n・必ず「${currentCategory}」分野のうち、『${targetSubtopic}』に焦点を当てた問題を作成してください。`;
        if (excludedRecentList.length > 0) {
            subtopicInstruction += `\n・直近の出題テーマ（${excludedRecentList.map(s => `『${s}』`).join('、')}）とは異なる切り口で出題してください。`;
        }
        if (avoidQuestionText) {
            const shortAvoid = avoidQuestionText.replace(/\s+/g, ' ').slice(0, 90);
            subtopicInstruction += `\n・直前の問題（「${shortAvoid}...」）と重複しない別事例・別条文から作問してください。`;
        }
    }

    let modeInstruction = '';
    let schemaSection = '';
    const quizMode = isHazardMode ? 'hazard' : 'tf';

    if (quizMode === 'hazard') {
        modeInstruction = `・出題形式は必ず【本免・危険予測イラスト3連○×問題（type: "hazard", points: 2）】としてください。
・以下の「利用可能な危険予測イラストシーン一覧」の中から今回のテーマに最も合うシーンを1つ選び、その id を "visual_id" に指定し、"visual_type": "hazard" を設定してください。
${hazardListText}
・選んだイラスト状況に完全に合致する3つの設問（statements配列：必ず3要素）を作成し、各設問について「正しい(true) / 誤り(false)」と簡潔な根拠(reason)を記載してください。
・3設問のうちすべて同じ答え（全部true等）に偏らず、trueとfalseを適切に混ぜてください。`;

        schemaSection = `■ 危険予測イラスト問題 (type: "hazard", points: 2)
{
  "type": "hazard",
  "points": 2,
  "visual_type": "hazard",
  "visual_id": "hazard_right_turn_blindspot",
  "question": "状況の導入文（図の状況を踏まえて、次の1〜3の記述は正しいですか。）",
  "statements": [
    { "text": "設問1の記述", "answer": false, "reason": "設問1の解説（50〜120字）" },
    { "text": "設問2の記述", "answer": true, "reason": "設問2の解説（50〜120字）" },
    { "text": "設問3の記述", "answer": false, "reason": "設問3の解説（50〜120字）" }
  ],
  "explanation": "【出題の趣旨】\\n...\\n\\n【場面のポイント】\\n...\\n\\n【ひっかけ注意・ワンポイント】\\n..."
}`;
    } else if (isSignMode) {
        modeInstruction = `・出題形式は必ず【道路標識・標示の○×問題（type: "tf", points: 1）】としてください。
・以下の「利用可能な道路標識・標示SVG一覧」の中から今回のテーマに合う標識を1つ選び、"visual_type": "sign" と "visual_id" にその正確な id を指定してください（※一覧にないidは絶対に使わないでください）。
${signListText}
・問題文は「図の標識は〜」「図のような道路標示がある場所では〜」のように図を参照する本番形式の文章にし、**問題文の中にその標識の正式名称をそのまま書かないでください**（回答前にネタバレになるため。ただし「図の標識は『〇〇』を表している」という正誤判定問題自体は可）。
・問題文の結論と boolean の "answer" (true=正しい / false=誤り) に1ミリも矛盾がないよう必ず自己検証してください。`;

        schemaSection = `■ 道路標識・標示 ○×問題 (type: "tf", points: 1)
{
  "type": "tf",
  "points": 1,
  "visual_type": "sign",
  "visual_id": "no_stopping",
  "isTrick": true,
  "question": "図の標識がある場所では、駐車は禁止されているが、人の乗り降りのための短時間の停止であればできる。",
  "answer": false,
  "explanation": "【出題の趣旨】\\n...\\n\\n【判定と詳細解説】\\n**判定：❌ 誤り**\\n...\\n\\n【ひっかけ注意・ワンポイント】\\n..."
}`;
    } else {
        modeInstruction = `・出題形式は必ず【普通免許 学科試験 本番○×問題（type: "tf", points: 1）】としてください。
・4択ではなく、1つの記述に対して「正しい(true) / 誤り(false)」を判定させる本番形式の単文にしてください。
・"visual_type": null, "visual_id": null としてください。
・問題文が肯定文・例外規定・数値を含めて道路交通法上完全に正しいときのみ answer: true、1箇所でも法令と異なる点があれば answer: false にしてください。`;

        schemaSection = `■ 普通免許 ○×問題 (type: "tf", points: 1)
{
  "type": "tf",
  "points": 1,
  "visual_type": null,
  "visual_id": null,
  "isTrick": true,
  "question": "本番の学科試験形式の日本語の問題文（1〜2文程度）",
  "answer": false,
  "explanation": "【出題の趣旨】\\n...\\n\\n【判定と詳細解説】\\n**判定：❌ 誤り**（または **判定：⭕ 正しい**）\\n理由と条文・数値の根拠...\\n\\n【ひっかけ注意・ワンポイント】\\n..."
}`;
    }

    const prompt = `あなたは日本の指定自動車教習所のベテラン学科教官であり、普通自動車第一種運転免許 学科試験の作問専門家です。
以下の要件と「日本の道路交通法 厳密基準リファレンス」を厳守し、「${examName}」の「${currentCategory}」分野から本番レベルの正確な問題を1問作成してください。
${subtopicInstruction}

${TRAFFIC_LAW_REFERENCE}

【出題要件】
${modeInstruction}
${isTrickMode ? '・【ひっかけ・数値特訓優先】本試験で受験生が落としやすい「具体的な数値（5m/10m/30m/3秒/3.5t未満/1.2倍等）のすり替え」「義務（〜しなければならない）と許容（〜することができる）の混同」「例外規定の有無」を意図的に論点に組み込んでください。isTrick を true にしてください。' : ''}
${useSearchGrounding ? '・【Google検索グラウンディング連動】必ずGoogle検索ツールを用いて、最新の道路交通法改正・施行令を確認し、現行の最新制度に基づいた正確な問題および解説を作成してください。' : ''}
・【絶対厳守：自己検証ルール】JSON出力する前に必ず、①問題文の事実関係が道路交通法に違反していないか、②問題文の結論と answer (true / false) が完全に一致しているか、③解説の冒頭判定（⭕正しい / ❌誤り）と answer の値が食い違っていないか、の3点を頭の中で検証してください。
・解説(explanation)は必ずマークダウン形式で「【出題の趣旨】」「【判定と詳細解説】（危険予測時は【場面のポイント】）」「【ひっかけ注意・ワンポイント】」を含めてください。

【出力形式】
出力は必ず以下のJSON形式のみとすること（\`\`\`json 等で囲まないこと。前置きや後書きは一切出力しないこと）。

${schemaSection}`;

    const initialRetries = isPrefetch ? 0 : 2;
    const fetchWithRetry = async (fetcher, retries = initialRetries, attempt = 1) => {
        try {
            return await fetcher(prompt, apiKey, { useSearchGrounding, quizMode, isSignMode, isTrickMode });
        } catch (e) {
            const msg = e && e.message ? e.message : '';
            const isNetworkErr = e instanceof TypeError || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg === 'NETWORK_ERROR';
            const isRetryable = msg === 'RATE_LIMIT' || msg === 'SERVER_OVERLOAD' || msg === 'INVALID_QUIZ_FORMAT' || isNetworkErr;
            if (isRetryable && retries > 0) {
                const waitMs = msg === 'RATE_LIMIT' ? 3000 * attempt : 1500 * attempt;
                console.warn(`[DriveGenius Retry] Reason: ${msg || 'Network'}. Retrying in ${waitMs}ms... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
                return await fetchWithRetry(fetcher, retries - 1, attempt + 1);
            }
            if (isNetworkErr) throw new Error('NETWORK_ERROR');
            throw e;
        }
    };

    let quizResult;
    if (engine === 'gemini') quizResult = await fetchWithRetry(fetchGemini);
    else if (engine === 'groq') quizResult = await fetchWithRetry(fetchGroq);
    else if (engine === 'openrouter') quizResult = await fetchWithRetry(fetchOpenRouter);
    else quizResult = await fetchWithRetry(fetchOpenAI);

    if (quizResult && typeof quizResult === 'object') {
        quizResult.subtopic = targetSubtopic || quizResult.subtopic || '';
        quizResult.source = 'ai';
        if (quizResult.isTrick === undefined) quizResult.isTrick = isTrickMode;
    }
    return quizResult;
}

function selectPriorityError(prevErr, nextErr) {
    if (!prevErr) return nextErr;
    if (!nextErr) return prevErr;
    const getRank = (err) => {
        const m = (err && err.message) ? err.message : '';
        if (m === 'AUTH_ERROR') return 100;
        if (m === 'OPENROUTER_PRIVACY_404') return 90;
        if (m === 'RATE_LIMIT' || m.includes('429')) return 80;
        if (m === 'SERVER_OVERLOAD' || m.includes('503') || m.includes('502')) return 70;
        if (m === 'INVALID_QUIZ_FORMAT' || m.startsWith('OPENROUTER_PARSE_FAIL:')) return 60;
        return 10;
    };
    return getRank(nextErr) >= getRank(prevErr) ? nextErr : prevErr;
}

function formatUserErrorMessage(e) {
    const msg = (e && e.message) ? e.message : '';
    if (msg === 'API Key missing') return 'AI生成を使うには右上の⚙️設定からAPIキーを入力するか、出題形式を「精査済み問題バンクのみ」に切り替えてください。';
    if (msg === 'BANK_EXHAUSTED_NO_KEY') return 'この分野の問題バンクを一巡しました。⚙️設定でAPIキーを入力するとAI類題生成が利用できます。';
    if (msg === 'AUTH_ERROR' || msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID')) return 'APIキーが無効または権限がありません。右上の⚙️設定をご確認ください。';
    if (msg === 'OPENROUTER_PRIVACY_404') return 'OpenRouterのPrivacy設定(Free endpoints)がOFFのため404が返されました。右上の📖マニュアルをご確認ください。';
    if (msg === 'RATE_LIMIT' || msg.includes('429')) return '短時間のリクエスト集中により無料枠のスピード制限に達しました。10〜20秒ほど待ってから再度お試しください。';
    if (msg === 'SERVER_OVERLOAD' || msg.includes('503') || msg.includes('502') || msg.includes('504')) return 'AIサーバーが一時的に混雑しています。数秒待って再試行するか、精査済み問題バンクをご利用ください。';
    if (msg === 'NETWORK_ERROR' || msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'ネットワーク通信エラーが発生しました。接続をご確認のうえ再試行してください。';
    if (msg === 'INVALID_QUIZ_FORMAT' || msg.startsWith('OPENROUTER_PARSE_FAIL:') || msg.includes('JSON parsing failed')) return 'AIが不正な形式のデータを返しました。もう一度ボタンを押して再生成してください。';
    return `出題エラー: ${msg || '不明なエラーが発生しました'}`;
}

function coerceBooleanAnswer(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (['true', '○', '◯', '⭕', '正', '正しい', 'yes', '1'].includes(s)) return true;
        if (['false', '×', '✕', '❌', '誤', '誤り', 'no', '0'].includes(s)) return false;
    }
    return null;
}

function validateAndNormalizeQuiz(quiz, options = {}) {
    const { quizMode = 'tf', isSignMode = false } = options;

    if (!quiz || typeof quiz !== 'object') throw new Error('INVALID_QUIZ_FORMAT');
    if (!quiz.question || typeof quiz.question !== 'string' || !quiz.explanation || typeof quiz.explanation !== 'string') {
        throw new Error('INVALID_QUIZ_FORMAT');
    }

    const detectedType = quiz.type === 'hazard' || Array.isArray(quiz.statements) ? 'hazard' : 'tf';
    if (quizMode === 'hazard' && detectedType !== 'hazard') throw new Error('INVALID_QUIZ_FORMAT');
    if (quizMode === 'tf' && detectedType === 'hazard') throw new Error('INVALID_QUIZ_FORMAT');

    if (detectedType === 'hazard') {
        if (!Array.isArray(quiz.statements) || quiz.statements.length !== 3) {
            throw new Error('INVALID_QUIZ_FORMAT');
        }
        const normalizedStmts = quiz.statements.map(st => {
            if (!st || typeof st.text !== 'string' || !st.text.trim()) throw new Error('INVALID_QUIZ_FORMAT');
            const ans = coerceBooleanAnswer(st.answer);
            if (ans === null) throw new Error('INVALID_QUIZ_FORMAT');
            return {
                text: st.text.trim(),
                answer: ans,
                reason: typeof st.reason === 'string' ? st.reason.trim() : ''
            };
        });
        quiz.type = 'hazard';
        quiz.points = 2;
        quiz.statements = normalizedStmts;
        quiz.visual_type = 'hazard';
        if (!quiz.visual_id || !HAZARD_SCENES[quiz.visual_id]) {
            const keys = Object.keys(HAZARD_SCENES);
            if (keys.length === 0) throw new Error('INVALID_QUIZ_FORMAT');
            quiz.visual_id = keys[Math.floor(Math.random() * keys.length)];
        }
    } else {
        const ans = coerceBooleanAnswer(quiz.answer);
        if (ans === null) throw new Error('INVALID_QUIZ_FORMAT');
        quiz.type = 'tf';
        quiz.points = 1;
        quiz.answer = ans;

        if (quiz.visual_type === 'sign' || isSignMode) {
            if (quiz.visual_id && ROAD_SIGNS[quiz.visual_id]) {
                quiz.visual_type = 'sign';
            } else if (isSignMode) {
                throw new Error('INVALID_QUIZ_FORMAT');
            } else {
                quiz.visual_type = null;
                quiz.visual_id = null;
            }
        } else {
            quiz.visual_type = null;
            quiz.visual_id = null;
        }
    }

    quiz.isTrick = Boolean(quiz.isTrick);
    return quiz;
}

function escapeControlCharsInJsonStrings(str) {
    let result = '';
    let inString = false;
    let isEscaped = false;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (!inString) {
            if (ch === '"') inString = true;
            result += ch;
        } else {
            if (isEscaped) { isEscaped = false; result += ch; }
            else if (ch === '\\') { isEscaped = true; result += ch; }
            else if (ch === '"') { inString = false; result += ch; }
            else if (ch === '\n') result += '\\n';
            else if (ch === '\r') result += '\\r';
            else if (ch === '\t') result += '\\t';
            else if (ch.charCodeAt(0) < 0x20) result += '';
            else result += ch;
        }
    }
    return result;
}

function parseRobustJSON(text) {
    if (!text || typeof text !== 'string') throw new Error('INVALID_QUIZ_FORMAT');
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
        cleaned = match[1].trim();
    } else {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
    }
    try {
        return JSON.parse(cleaned);
    } catch (e1) {
        try {
            return JSON.parse(escapeControlCharsInJsonStrings(cleaned));
        } catch (e2) {
            console.error('Raw LLM response parsing failed:', text);
            throw new Error('INVALID_QUIZ_FORMAT');
        }
    }
}

function buildGeminiResponseSchema(quizMode) {
    if (quizMode === 'hazard') {
        return {
            type: 'OBJECT',
            properties: {
                type: { type: 'STRING', enum: ['hazard'] },
                points: { type: 'INTEGER' },
                visual_type: { type: 'STRING', enum: ['hazard'] },
                visual_id: { type: 'STRING' },
                question: { type: 'STRING' },
                statements: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            text: { type: 'STRING' },
                            answer: { type: 'BOOLEAN' },
                            reason: { type: 'STRING' }
                        },
                        required: ['text', 'answer', 'reason']
                    }
                },
                explanation: { type: 'STRING' }
            },
            required: ['type', 'points', 'visual_type', 'visual_id', 'question', 'statements', 'explanation']
        };
    }
    return {
        type: 'OBJECT',
        properties: {
            type: { type: 'STRING', enum: ['tf'] },
            points: { type: 'INTEGER' },
            visual_type: { type: 'STRING', nullable: true },
            visual_id: { type: 'STRING', nullable: true },
            isTrick: { type: 'BOOLEAN' },
            question: { type: 'STRING' },
            answer: { type: 'BOOLEAN' },
            explanation: { type: 'STRING' }
        },
        required: ['type', 'points', 'question', 'answer', 'explanation']
    };
}

function extractGeminiGrounding(candidate) {
    const meta = candidate?.groundingMetadata;
    if (!meta) return null;
    const queries = Array.isArray(meta.webSearchQueries) ? meta.webSearchQueries.filter(Boolean) : [];
    const sources = [];
    if (Array.isArray(meta.groundingChunks)) {
        meta.groundingChunks.forEach(chunk => {
            if (chunk?.web?.uri) {
                sources.push({ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri });
            }
        });
    }
    if (queries.length === 0 && sources.length === 0) return null;
    return { queries, sources };
}

async function fetchGemini(prompt, apiKey, options = {}) {
    const { useSearchGrounding = false, quizMode = 'tf' } = options;
    const geminiModels = ['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    let lastError = null;
    const responseSchema = buildGeminiResponseSchema(quizMode);

    for (const model of geminiModels) {
        try {
            const isGemini4 = model.startsWith('gemini-4');
            let requestBody;
            if (useSearchGrounding) {
                requestBody = {
                    contents: [{ parts: [{ text: prompt }] }],
                    tools: [{ google_search: {} }]
                };
                if (!isGemini4) requestBody.generationConfig = { temperature: 0.4 };
            } else {
                const genConfig = {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema
                };
                if (!isGemini4) genConfig.temperature = 0.5;
                requestBody = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: genConfig
                };
            }

            let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok && response.status === 400 && useSearchGrounding && !isGemini4) {
                const errCheck = await response.text().catch(() => '');
                if (!errCheck.includes('API_KEY_INVALID')) {
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.5,
                                responseMimeType: 'application/json',
                                responseSchema: responseSchema
                            }
                        })
                    });
                } else {
                    throw new Error('AUTH_ERROR');
                }
            }

            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                if ((response.status === 400 && errText.includes('API_KEY_INVALID')) || response.status === 401) {
                    throw new Error('AUTH_ERROR');
                }
                let stepErr;
                if (response.status === 429) {
                    stepErr = new Error('RATE_LIMIT');
                    await new Promise(r => setTimeout(r, 1200));
                } else if (response.status >= 500) {
                    stepErr = new Error('SERVER_OVERLOAD');
                } else {
                    stepErr = new Error(`Gemini API Error: ${response.status}`);
                }
                lastError = selectPriorityError(lastError, stepErr);
                continue;
            }

            const data = await response.json();
            const candidate = data?.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            const rawText = parts.filter(p => !p.thought).map(p => p.text || '').join('\n');
            let quiz = validateAndNormalizeQuiz(parseRobustJSON(rawText), options);
            quiz.exam = currentExam;
            quiz.category = currentCategory;
            quiz.usedModel = model;
            quiz.grounding = extractGeminiGrounding(candidate);
            return quiz;
        } catch (e) {
            if (e.message === 'AUTH_ERROR') throw e;
            lastError = selectPriorityError(lastError, e);
            console.warn(`[Gemini] Model ${model} failed: ${e.message}`);
        }
    }
    throw lastError || new Error('SERVER_OVERLOAD');
}

async function fetchOpenAI(prompt, apiKey, options = {}) {
    const openaiModels = ['gpt-4o-mini', 'gpt-4.1-mini'];
    let lastError = null;
    for (const model of openaiModels) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: 'You are a strict JSON output generator for Japanese driving license exam true/false and hazard prediction quizzes.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.5
                })
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error('AUTH_ERROR');
                let stepErr;
                if (response.status === 429) { stepErr = new Error('RATE_LIMIT'); await new Promise(r => setTimeout(r, 1200)); }
                else if (response.status >= 500) stepErr = new Error('SERVER_OVERLOAD');
                else stepErr = new Error(`OpenAI API Error: ${response.status}`);
                lastError = selectPriorityError(lastError, stepErr);
                continue;
            }
            const data = await response.json();
            let quiz = validateAndNormalizeQuiz(parseRobustJSON(data?.choices?.[0]?.message?.content), options);
            quiz.exam = currentExam;
            quiz.category = currentCategory;
            quiz.usedModel = model;
            return quiz;
        } catch (e) {
            if (e.message === 'AUTH_ERROR') throw e;
            lastError = selectPriorityError(lastError, e);
        }
    }
    throw lastError || new Error('SERVER_OVERLOAD');
}

async function fetchGroq(prompt, apiKey, options = {}) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    let lastError = null;
    for (const model of groqModels) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: 'You are a strict JSON output generator for Japanese driving license exam quizzes.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.5
                })
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error('AUTH_ERROR');
                let stepErr;
                if (response.status === 429) { stepErr = new Error('RATE_LIMIT'); await new Promise(r => setTimeout(r, 1200)); }
                else if (response.status >= 500) stepErr = new Error('SERVER_OVERLOAD');
                else stepErr = new Error(`Groq API Error: ${response.status}`);
                lastError = selectPriorityError(lastError, stepErr);
                continue;
            }
            const data = await response.json();
            let quiz = validateAndNormalizeQuiz(parseRobustJSON(data?.choices?.[0]?.message?.content), options);
            quiz.exam = currentExam;
            quiz.category = currentCategory;
            quiz.usedModel = model;
            return quiz;
        } catch (e) {
            if (e.message === 'AUTH_ERROR') throw e;
            lastError = selectPriorityError(lastError, e);
        }
    }
    throw lastError || new Error('SERVER_OVERLOAD');
}

async function fetchOpenRouter(prompt, apiKey, options = {}) {
    const freeModels = ['openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-3-27b-it:free', 'deepseek/deepseek-r1:free'];
    let lastError = null;
    for (const model of freeModels) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.href || 'http://localhost',
                    'X-Title': 'DriveGenius'
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert Japanese driving license exam quiz generator. Output ONLY a single valid JSON object with no other text or markdown.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.4
                })
            });
            if (!response.ok) {
                const errBody = await response.text().catch(() => '(no body)');
                if (response.status === 401) throw new Error('AUTH_ERROR');
                let stepErr;
                if (response.status === 429) { stepErr = new Error('RATE_LIMIT'); await new Promise(r => setTimeout(r, 1200)); }
                else if (response.status === 404 && (errBody.includes('data policy') || errBody.includes('Privacy'))) stepErr = new Error('OPENROUTER_PRIVACY_404');
                else if (response.status >= 500) stepErr = new Error('SERVER_OVERLOAD');
                else stepErr = new Error(`HTTP ${response.status}: ${errBody}`);
                lastError = selectPriorityError(lastError, stepErr);
                continue;
            }
            const data = await response.json();
            if (data.error) {
                const errCode = Number(data.error.code) || 0;
                const errMsg = String(data.error.message || '');
                let stepErr = errCode === 429 || errMsg.toLowerCase().includes('rate')
                    ? new Error('RATE_LIMIT')
                    : (errCode === 404 && (errMsg.includes('data policy') || errMsg.includes('Privacy'))
                        ? new Error('OPENROUTER_PRIVACY_404')
                        : new Error(`API Error: ${errMsg}`));
                lastError = selectPriorityError(lastError, stepErr);
                continue;
            }
            const rawContent = data?.choices?.[0]?.message?.content;
            if (!rawContent || !rawContent.trim()) {
                lastError = selectPriorityError(lastError, new Error('INVALID_QUIZ_FORMAT'));
                continue;
            }
            let quiz = validateAndNormalizeQuiz(parseRobustJSON(rawContent), options);
            quiz.exam = currentExam;
            quiz.category = currentCategory;
            quiz.usedModel = model;
            return quiz;
        } catch (e) {
            if (e.message === 'AUTH_ERROR') throw e;
            lastError = selectPriorityError(lastError, e);
        }
    }
    throw lastError || new Error('SERVER_OVERLOAD');
}

// ==========================================================================
// 問題表示・○×判定・危険予測3連○×採点
// ==========================================================================

function getExamShortLabel(examKey) {
    return (EXAM_DATA[examKey] && (EXAM_DATA[examKey].shortName || EXAM_DATA[examKey].name)) || examKey || '普通免許';
}

function renderVisualSection(quiz, revealAnswer = false) {
    if (!quizVisualContainer) return;
    const html = typeof window.renderQuizVisualHTML === 'function'
        ? window.renderQuizVisualHTML(quiz, { revealAnswer })
        : '';
    if (html) {
        quizVisualContainer.innerHTML = html;
        quizVisualContainer.classList.remove('hidden');
    } else {
        quizVisualContainer.innerHTML = '';
        quizVisualContainer.classList.add('hidden');
    }
}

function displayQuiz(quiz) {
    stopSpeaking();
    ensureQuizId(quiz);
    currentQuiz = quiz;
    isCurrentQuizAnswered = false;
    hazardUserSelections = [null, null, null];

    resetTutorChat();
    if (Array.isArray(quiz.tutorHistory) && quiz.tutorHistory.length > 0) {
        restoreTutorChat(quiz.tutorHistory);
    }
    updateBookmarkToggleUI();

    renderVisualSection(quiz, false);
    questionText.innerHTML = marked.parse(quiz.question || '');

    if (answerSummaryBanner) {
        answerSummaryBanner.innerHTML = '';
        answerSummaryBanner.classList.add('hidden');
    }

    const examLabel = getExamShortLabel(quiz.exam);
    if (isReviewMode) {
        engineBadge.textContent = `復習: [${examLabel}] ${quiz.category}`;
    } else if (isBookmarkMode) {
        engineBadge.textContent = `⭐ ブックマーク: [${examLabel}] ${quiz.category}`;
    } else if (quiz.source === 'bank') {
        engineBadge.textContent = `[${examLabel}] ${quiz.category}`;
    } else if (quiz.usedModel) {
        const modelDisplayMap = {
            'gemini-4-hydrogen': 'Gemini 4 Hydrogen',
            'gemini-2.5-flash': 'Gemini 2.5 Flash',
            'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite'
        };
        const displayModelName = modelDisplayMap[quiz.usedModel] || quiz.usedModel;
        const hasGrounding = Boolean(quiz.grounding && ((quiz.grounding.sources && quiz.grounding.sources.length > 0) || (quiz.grounding.queries && quiz.grounding.queries.length > 0)));
        engineBadge.textContent = hasGrounding ? `${displayModelName} (🌐Web検索連動)` : displayModelName;
    } else {
        engineBadge.textContent = `[${examLabel}] ${quiz.category}`;
    }

    if (sourceBadge) {
        const pts = quiz.type === 'hazard' ? 2 : (quiz.points || 1);
        const ptsLabel = quiz.type === 'hazard' ? `配点 ${pts}点（全問正解）` : `配点 ${pts}点`;
        if (quiz.source === 'bank') {
            sourceBadge.className = 'badge source-badge-bank';
            sourceBadge.textContent = `✅ 精査バンク ・ ${ptsLabel}`;
        } else {
            sourceBadge.className = 'badge source-badge-ai';
            sourceBadge.textContent = `🤖 AI生成 ・ ${ptsLabel}`;
        }
    }

    if (subtopicBadge) {
        if (quiz.subtopic) {
            subtopicBadge.textContent = `📌 ${quiz.subtopic}`;
            subtopicBadge.classList.remove('hidden');
        } else {
            subtopicBadge.textContent = '';
            subtopicBadge.classList.add('hidden');
        }
    }

    if (quiz.type === 'hazard' && Array.isArray(quiz.statements)) {
        if (tfContainer) tfContainer.classList.add('hidden');
        if (hazardContainer) hazardContainer.classList.remove('hidden');
        renderHazardStatementsUI(quiz.statements);
    } else {
        if (hazardContainer) hazardContainer.classList.add('hidden');
        if (tfContainer) tfContainer.classList.remove('hidden');
        [tfTrueBtn, tfFalseBtn].forEach(btn => {
            if (!btn) return;
            btn.disabled = false;
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
    }

    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
}

function renderHazardStatementsUI(statements) {
    if (!hazardStatementsList) return;
    hazardStatementsList.innerHTML = '';

    statements.forEach((st, idx) => {
        const card = document.createElement('div');
        card.className = 'hazard-statement-card';
        card.dataset.index = String(idx);
        card.innerHTML = `
            <div class="hazard-stmt-top">
                <span class="hazard-stmt-num">${idx + 1}</span>
                <div class="hazard-stmt-text">${st.text}</div>
            </div>
            <div class="hazard-toggle-group">
                <button type="button" class="hazard-toggle-btn btn-hazard-true" data-val="true">⭕ 正しい (○)</button>
                <button type="button" class="hazard-toggle-btn btn-hazard-false" data-val="false">❌ 誤り (×)</button>
            </div>
            <div class="hazard-reason-box hidden"></div>
        `;

        const trueBtn = card.querySelector('.btn-hazard-true');
        const falseBtn = card.querySelector('.btn-hazard-false');

        const selectOption = (val) => {
            if (isCurrentQuizAnswered) return;
            hazardUserSelections[idx] = val;
            trueBtn.classList.toggle('is-active-true', val === true);
            falseBtn.classList.toggle('is-active-false', val === false);
        };

        trueBtn.addEventListener('click', () => selectOption(true));
        falseBtn.addEventListener('click', () => selectOption(false));

        hazardStatementsList.appendChild(card);
    });

    if (submitHazardBtn) {
        submitHazardBtn.disabled = false;
        submitHazardBtn.classList.remove('hidden');
    }
}

function handleTfAnswer(userAnswerBool) {
    if (!currentQuiz || currentQuiz.type !== 'tf' || isCurrentQuizAnswered) return;
    isCurrentQuizAnswered = true;

    const correctAnswerBool = Boolean(currentQuiz.answer);
    const isCorrect = userAnswerBool === correctAnswerBool;

    [tfTrueBtn, tfFalseBtn].forEach(btn => {
        if (!btn) return;
        btn.disabled = true;
        const btnVal = btn.dataset.val === 'true';
        if (btnVal === userAnswerBool) btn.classList.add('selected');
        if (btnVal === correctAnswerBool) btn.classList.add('correct');
        else if (btnVal === userAnswerBool && !isCorrect) btn.classList.add('incorrect');
    });

    // 標識問題の場合は回答後に正式名称キャプションを表示（ネタバレ解除）
    if (currentQuiz.visual_type === 'sign') {
        renderVisualSection(currentQuiz, true);
    }

    updateStatsAndMistakes(isCorrect);

    resultSection.className = `glass-card result-section ${isCorrect ? 'result-correct' : 'result-incorrect'}`;
    resultIcon.textContent = isCorrect ? '🎉' : '💡';
    resultTitle.textContent = isCorrect ? '正解！（＋1点）' : '不正解...（0点）';

    if (answerSummaryBanner) {
        const userMark = userAnswerBool ? '⭕ 正しい (○)' : '❌ 誤り (×)';
        const ansMark = correctAnswerBool ? '⭕ 正しい (○)' : '❌ 誤り (×)';
        answerSummaryBanner.innerHTML = `
            <span>あなたの解答：<strong>${userMark}</strong></span>
            <span>正解：<strong>${ansMark}</strong></span>
        `;
        answerSummaryBanner.classList.remove('hidden');
    }

    explanationText.innerHTML = formatExplanationHTML(currentQuiz.explanation, currentQuiz);
    renderGroundingInfo(currentQuiz);
    updateBookmarkToggleUI();
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (!isReviewMode && !isBookmarkMode) {
        scheduleBackgroundPrefetch();
    }
}

function handleHazardSubmit() {
    if (!currentQuiz || currentQuiz.type !== 'hazard' || isCurrentQuizAnswered) return;
    if (hazardUserSelections.some(v => v === null)) {
        showToast('1〜3のすべての設問について ○ または × を選択してください');
        return;
    }

    isCurrentQuizAnswered = true;
    if (submitHazardBtn) submitHazardBtn.disabled = true;

    let matchCount = 0;
    const cards = hazardStatementsList ? hazardStatementsList.querySelectorAll('.hazard-statement-card') : [];
    currentQuiz.statements.forEach((st, idx) => {
        const userVal = hazardUserSelections[idx];
        const stmtCorrect = userVal === Boolean(st.answer);
        if (stmtCorrect) matchCount++;

        const card = cards[idx];
        if (card) {
            card.classList.add(stmtCorrect ? 'stmt-correct' : 'stmt-incorrect');
            const trueBtn = card.querySelector('.btn-hazard-true');
            const falseBtn = card.querySelector('.btn-hazard-false');
            if (trueBtn) trueBtn.disabled = true;
            if (falseBtn) falseBtn.disabled = true;
            if (st.answer === true && trueBtn) trueBtn.classList.add('is-correct-answer');
            if (st.answer === false && falseBtn) falseBtn.classList.add('is-correct-answer');

            const reasonBox = card.querySelector('.hazard-reason-box');
            if (reasonBox) {
                const ansText = st.answer ? '⭕ 正しい' : '❌ 誤り';
                const statusText = stmtCorrect ? '✅ 一致' : '❌ 不一致';
                reasonBox.innerHTML = `<strong>[${statusText} ／ 正解: ${ansText}]</strong> ${st.reason || ''}`;
                reasonBox.classList.remove('hidden');
            }
        }
    });

    const isAllCorrect = matchCount === 3;
    updateStatsAndMistakes(isAllCorrect);

    resultSection.className = `glass-card result-section ${isAllCorrect ? 'result-correct' : 'result-incorrect'}`;
    resultIcon.textContent = isAllCorrect ? '🎉' : '💡';
    resultTitle.textContent = isAllCorrect ? '完全正解！（＋2点）' : `不正解...（3問中${matchCount}問一致 ／ 本番配点：0点）`;

    if (answerSummaryBanner) {
        answerSummaryBanner.innerHTML = `
            <span>危険予測 3設問の結果：<strong>3問中 ${matchCount}問 一致</strong></span>
            <span>本免配点（3問全問正解で2点）：<strong>${isAllCorrect ? '🏆 2点獲得' : '0点'}</strong></span>
        `;
        answerSummaryBanner.classList.remove('hidden');
    }

    explanationText.innerHTML = formatExplanationHTML(currentQuiz.explanation, currentQuiz);
    renderGroundingInfo(currentQuiz);
    updateBookmarkToggleUI();
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (!isReviewMode && !isBookmarkMode) {
        scheduleBackgroundPrefetch();
    }
}

// ==========================================================================
// 解説文の自動構造化フォーマッター
// ==========================================================================

function formatExplanationHTML(rawExplanation) {
    if (!rawExplanation || typeof rawExplanation !== 'string') return '';
    const normalized = rawExplanation
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    const lines = normalized.split('\n');
    const secHeaderRegex = /^[\s>\-\*#]*\**【(出題の趣旨|判定と詳細解説|場面のポイント|3設問の解説|詳細解説|ひっかけ注意・ワンポイント|ワンポイントアドバイス|模範解答[^】]*)】\**[\s:：]*(.*)$/;

    const htmlParts = [];
    let mdBuffer = [];

    const flushMdBuffer = () => {
        const text = mdBuffer.join('\n').trim();
        if (text) htmlParts.push(marked.parse(text));
        mdBuffer = [];
    };

    for (const line of lines) {
        const secMatch = line.match(secHeaderRegex);
        if (secMatch) {
            flushMdBuffer();
            const secTitle = secMatch[1];
            const secRest = (secMatch[2] || '').trim();
            let icon = '✅';
            if (secTitle.includes('趣旨')) icon = '🎯';
            else if (secTitle.includes('場面')) icon = '🗺️';
            else if (secTitle.includes('詳細') || secTitle.includes('判定') || secTitle.includes('設問')) icon = '📖';
            else if (secTitle.includes('ひっかけ') || secTitle.includes('アドバイス') || secTitle.includes('ワンポイント')) icon = '💡';
            htmlParts.push(`<div class="exp-section-title">${icon} 【${secTitle}】</div>`);
            if (secRest) mdBuffer.push(secRest);
            continue;
        }
        mdBuffer.push(line);
    }
    flushMdBuffer();
    return htmlParts.join('\n');
}

function renderGroundingInfo(quiz) {
    if (!groundingInfoBox || !groundingSourcesList) return;
    groundingSourcesList.innerHTML = '';
    const g = quiz && quiz.grounding;
    if (!g || ((!g.sources || g.sources.length === 0) && (!g.queries || g.queries.length === 0))) {
        groundingInfoBox.classList.add('hidden');
        return;
    }
    if (Array.isArray(g.queries)) {
        g.queries.slice(0, 4).forEach(q => {
            const qChip = document.createElement('span');
            qChip.className = 'grounding-query-chip';
            qChip.textContent = `🔍 ${q}`;
            groundingSourcesList.appendChild(qChip);
        });
    }
    if (Array.isArray(g.sources)) {
        g.sources.slice(0, 5).forEach(src => {
            const a = document.createElement('a');
            a.className = 'grounding-source-chip';
            a.href = src.uri;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = `🔗 ${src.title}`;
            groundingSourcesList.appendChild(a);
        });
    }
    groundingInfoBox.classList.remove('hidden');
}

// ==========================================================================
// AI教習指導員への深掘り質問チャット
// ==========================================================================

function resetTutorChat() {
    currentTutorHistory = [];
    isTutorLoading = false;
    if (aiTutorSection) aiTutorSection.classList.remove('has-chat-history');
    if (tutorChatHistory) {
        tutorChatHistory.innerHTML = '';
        tutorChatHistory.classList.add('hidden');
    }
    if (tutorInput) { tutorInput.value = ''; tutorInput.disabled = false; }
    if (tutorSendBtn) {
        tutorSendBtn.disabled = false;
        const tText = tutorSendBtn.querySelector('.btn-text');
        const tSpin = tutorSendBtn.querySelector('.spinner');
        if (tText) tText.classList.remove('hidden');
        if (tSpin) tSpin.classList.add('hidden');
    }
    if (tutorChipBtns) tutorChipBtns.forEach(c => { c.disabled = false; });
}

function appendUserChatBubble(questionStr) {
    if (!tutorChatHistory) return;
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'tutor-msg tutor-msg-user';
    const roleSpan = document.createElement('span');
    roleSpan.className = 'tutor-msg-role';
    roleSpan.textContent = '🙋 あなたの質問';
    const bodyDiv = document.createElement('div');
    bodyDiv.textContent = questionStr;
    userMsgEl.appendChild(roleSpan);
    userMsgEl.appendChild(bodyDiv);
    tutorChatHistory.appendChild(userMsgEl);
}

function renderTutorAiBubbleContent(aiMsgEl, questionStr, answerMarkdown) {
    aiMsgEl.innerHTML = `
        <div class="tutor-msg-header">
            <span class="tutor-msg-role">🎓 AI教習指導員</span>
            <div class="tutor-bubble-actions">
                <button type="button" class="tutor-mini-btn btn-copy-turn" title="この回答をコピー">📋 コピー</button>
                <button type="button" class="tutor-mini-btn btn-save-turn-md" title="この質疑応答をMarkdown(.md)で保存">💾 MD保存</button>
            </div>
        </div>
        <div class="markdown-body question-markdown" style="margin-bottom:0; font-size:0.95rem;">${marked.parse(answerMarkdown || '')}</div>
    `;
    const copyBtn = aiMsgEl.querySelector('.btn-copy-turn');
    const saveMdBtn = aiMsgEl.querySelector('.btn-save-turn-md');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copyTextToClipboard(`【質問】\n${questionStr}\n\n【AI教習指導員の回答】\n${answerMarkdown}`, 'AI教官の回答をコピーしました');
        });
    }
    if (saveMdBtn) {
        saveMdBtn.addEventListener('click', () => {
            const examName = (currentQuiz && EXAM_DATA[currentQuiz.exam] && EXAM_DATA[currentQuiz.exam].name) || '普通免許 学科試験';
            const catName = (currentQuiz && currentQuiz.category) || '';
            const md = `# 🎓 AI教習指導員 質疑応答メモ (${examName} - ${catName})\n\n## 🙋 質問\n${questionStr}\n\n## 💡 AI教習指導員の回答\n${answerMarkdown}\n`;
            downloadMarkdownFile(md, `DriveGenius_AI教官回答_${getTodayString()}.md`);
            showToast('AI教官の回答をMarkdown(.md)で保存しました');
        });
    }
}

function restoreTutorChat(savedHistory) {
    if (!Array.isArray(savedHistory) || savedHistory.length === 0 || !tutorChatHistory) return;
    currentTutorHistory = savedHistory.map(h => ({ role: h.role, content: h.content }));
    tutorChatHistory.innerHTML = '';
    tutorChatHistory.classList.remove('hidden');
    if (aiTutorSection) aiTutorSection.classList.add('has-chat-history');

    let lastUserQ = '';
    for (const item of currentTutorHistory) {
        if (item.role === 'user') {
            lastUserQ = item.content;
            appendUserChatBubble(item.content);
        } else if (item.role === 'assistant') {
            const aiMsgEl = document.createElement('div');
            aiMsgEl.className = 'tutor-msg tutor-msg-ai';
            renderTutorAiBubbleContent(aiMsgEl, lastUserQ, item.content);
            tutorChatHistory.appendChild(aiMsgEl);
        }
    }
}

function setTutorLoadingState(loading) {
    isTutorLoading = loading;
    if (tutorInput) tutorInput.disabled = loading;
    if (tutorSendBtn) {
        tutorSendBtn.disabled = loading;
        const tText = tutorSendBtn.querySelector('.btn-text');
        const tSpin = tutorSendBtn.querySelector('.spinner');
        if (tText) tText.classList.toggle('hidden', loading);
        if (tSpin) tSpin.classList.toggle('hidden', !loading);
    }
    if (tutorChipBtns) tutorChipBtns.forEach(c => { c.disabled = loading; });
}

async function handleTutorQuestion(questionStr) {
    if (!currentQuiz || isTutorLoading || !questionStr) return;

    if (tutorInput) tutorInput.value = '';
    setTutorLoadingState(true);
    tutorChatHistory.classList.remove('hidden');
    if (aiTutorSection) aiTutorSection.classList.add('has-chat-history');

    appendUserChatBubble(questionStr);
    const aiMsgEl = document.createElement('div');
    aiMsgEl.className = 'tutor-msg tutor-msg-ai';
    aiMsgEl.innerHTML = `<span class="tutor-msg-role">🎓 AI教習指導員</span><div class="markdown-body" style="color:var(--text-secondary);">回答を作成しています...</div>`;
    tutorChatHistory.appendChild(aiMsgEl);
    tutorChatHistory.scrollTop = tutorChatHistory.scrollHeight;

    try {
        const answerMarkdown = await fetchTutorAnswer(questionStr);
        currentTutorHistory.push({ role: 'user', content: questionStr });
        currentTutorHistory.push({ role: 'assistant', content: answerMarkdown });

        currentQuiz.tutorHistory = [...currentTutorHistory];
        syncQuizToStorage(currentQuiz);

        renderTutorAiBubbleContent(aiMsgEl, questionStr, answerMarkdown);
        tutorChatHistory.scrollTop = tutorChatHistory.scrollHeight;
    } catch (e) {
        console.error('[AI Tutor Error]', e);
        aiMsgEl.innerHTML = `<span class="tutor-msg-role">🎓 AI教習指導員</span><div style="color:var(--error-color);">${formatUserErrorMessage(e)}</div>`;
    } finally {
        setTutorLoadingState(false);
        if (tutorInput) tutorInput.focus();
    }
}

// ==========================================================================
// 学習ノート保存（全文コピー & Markdownファイル保存）
// ==========================================================================

function buildStudyNoteMarkdown(quiz) {
    if (!quiz) return '';
    const examName = (EXAM_DATA[quiz.exam] && EXAM_DATA[quiz.exam].name) || (EXAM_DATA[currentExam] && EXAM_DATA[currentExam].name) || '普通免許 学科試験';
    const catName = quiz.category || currentCategory;
    const dateStr = getTodayString();

    let md = `# 🚗 DriveGenius 学習ノート: ${examName}（${catName}）\n`;
    md += `- 記録日: ${dateStr}\n`;
    if (quiz.subtopic) md += `- 論点: ${quiz.subtopic}\n`;
    md += `\n## 📝 問題\n${quiz.question}\n\n`;

    if (quiz.visual_type === 'sign' && quiz.visual_id && ROAD_SIGNS[quiz.visual_id]) {
        const s = ROAD_SIGNS[quiz.visual_id];
        md += `- 対象標識・標示: **${s.name}**（${s.category}）\n\n`;
    } else if (quiz.visual_type === 'hazard' && quiz.visual_id && HAZARD_SCENES[quiz.visual_id]) {
        const h = HAZARD_SCENES[quiz.visual_id];
        md += `- イラスト場面: **${h.title}**（${h.speed}）\n- 状況: ${h.situation}\n\n`;
    }

    if (quiz.type === 'hazard' && Array.isArray(quiz.statements)) {
        md += `## 🚦 3設問と正解（全問正解で2点）\n`;
        quiz.statements.forEach((st, idx) => {
            md += `${idx + 1}. ${st.text} → **${st.answer ? '⭕ 正しい (○)' : '❌ 誤り (×)'}**\n   - 根拠: ${st.reason || ''}\n`;
        });
        md += `\n`;
    } else {
        md += `## 🎯 正解\n**${quiz.answer ? '⭕ 正しい (○)' : '❌ 誤り (×)'}**\n\n`;
    }

    md += `## 📖 解説\n${quiz.explanation || ''}\n`;

    const history = (Array.isArray(currentTutorHistory) && currentTutorHistory.length > 0)
        ? currentTutorHistory
        : (Array.isArray(quiz.tutorHistory) ? quiz.tutorHistory : []);

    if (history.length > 0) {
        md += `\n---\n\n## 🎓 AI教習指導員との深掘り質疑応答 (${Math.floor(history.length / 2)}件)\n\n`;
        let qNum = 1;
        for (const turn of history) {
            if (turn.role === 'user') md += `### Q${qNum}. ${turn.content}\n\n`;
            else if (turn.role === 'assistant') { md += `${turn.content}\n\n`; qNum++; }
        }
    }
    return md;
}

async function copyTextToClipboard(text, successMsg) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        showToast(successMsg || 'クリップボードにコピーしました');
    } catch (e) {
        console.error('Clipboard copy failed:', e);
        showToast('コピーに失敗しました');
    }
}

function copyStudyNoteToClipboard() {
    if (!currentQuiz) return;
    const md = buildStudyNoteMarkdown(currentQuiz);
    const hasChat = currentTutorHistory.length > 0;
    copyTextToClipboard(md, hasChat ? '問題・解説・AIチャット全文をコピーしました！' : '問題・解説ノートをコピーしました！');
}

function downloadMarkdownFile(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadStudyNoteMarkdown() {
    if (!currentQuiz) return;
    const md = buildStudyNoteMarkdown(currentQuiz);
    const examLabel = (EXAM_DATA[currentQuiz.exam] && EXAM_DATA[currentQuiz.exam].name) || '普通免許';
    const safeExam = examLabel.replace(/[\\/:*?"<>|\s]/g, '');
    downloadMarkdownFile(md, `DriveGenius_学習ノート_${safeExam}_${getTodayString()}.md`);
    showToast('学習ノート(.md)をダウンロードしました');
}

// ==========================================================================
// ブックマーク（良問・解説・AI教官チャット記録）機能
// ==========================================================================

function ensureQuizId(quiz) {
    if (!quiz) return;
    if (!quiz.id) {
        quiz.id = `dg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
}

function isSameQuiz(a, b) {
    if (!a || !b) return false;
    if (a.id && b.id && a.id === b.id) return true;
    return Boolean(a.question && b.question && a.question === b.question && a.exam === b.exam);
}

function isQuizBookmarked(quiz) {
    if (!quiz) return false;
    return bookmarks.some(b => isSameQuiz(b, quiz));
}

function syncQuizToStorage(quiz) {
    if (!quiz) return;
    let bmUpdated = false;
    bookmarks = bookmarks.map(b => {
        if (isSameQuiz(b, quiz)) {
            bmUpdated = true;
            return { ...b, tutorHistory: Array.isArray(quiz.tutorHistory) ? [...quiz.tutorHistory] : b.tutorHistory };
        }
        return b;
    });
    if (bmUpdated) localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));

    let mkUpdated = false;
    mistakes = mistakes.map(m => {
        if (isSameQuiz(m, quiz)) {
            mkUpdated = true;
            return { ...m, tutorHistory: Array.isArray(quiz.tutorHistory) ? [...quiz.tutorHistory] : m.tutorHistory };
        }
        return m;
    });
    if (mkUpdated) localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify(mistakes));
    if (bmUpdated || mkUpdated) markLocalDataUpdated(true);
}

function updateBookmarkToggleUI() {
    if (!bookmarkToggleBtn) return;
    const saved = isQuizBookmarked(currentQuiz);
    bookmarkToggleBtn.classList.toggle('is-bookmarked', saved);
    const span = bookmarkToggleBtn.querySelector('.btn-text');
    if (span) span.textContent = saved ? '🌟 ブックマーク済み' : '⭐ ブックマーク保存';
}

function toggleCurrentQuizBookmark() {
    if (!currentQuiz) return;
    ensureQuizId(currentQuiz);
    if (currentTutorHistory.length > 0) currentQuiz.tutorHistory = [...currentTutorHistory];

    const existingIdx = bookmarks.findIndex(b => isSameQuiz(b, currentQuiz));
    if (existingIdx >= 0) {
        bookmarks.splice(existingIdx, 1);
        localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
        updateBookmarkBtnState();
        markLocalDataUpdated(true);
        showToast('ブックマークを解除しました');
    } else {
        bookmarks.unshift({
            ...currentQuiz,
            tutorHistory: Array.isArray(currentQuiz.tutorHistory) ? [...currentQuiz.tutorHistory] : [],
            savedAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
        updateBookmarkBtnState();
        markLocalDataUpdated(true);
        showToast('⭐ 問題・解説・チャット履歴をブックマークに保存しました');
    }
}

function openBookmarkModal() {
    if (!bookmarkModal) return;
    renderBookmarkList();
    bookmarkModal.classList.remove('hidden');
}

function renderBookmarkList() {
    if (!bookmarkListContainer) return;
    const filterVal = bookmarkFilterExam ? bookmarkFilterExam.value : 'all';
    const filtered = filterVal === 'all' ? bookmarks : bookmarks.filter(b => b.exam === filterVal);

    if (startBookmarkPracticeBtn) startBookmarkPracticeBtn.disabled = filtered.length === 0;
    bookmarkListContainer.innerHTML = '';

    if (filtered.length === 0) {
        bookmarkListContainer.innerHTML = `
            <div class="bookmark-empty">
                <p style="font-size: 1.05rem; margin-bottom: 0.4rem;">⭐ 保存されたブックマークはまだありません</p>
                <p style="font-size: 0.85rem;">問題の解答後に表示される「⭐ ブックマーク保存」ボタンを押すと、良問・解説・AI教官とのチャット履歴をここに永久保存できます。</p>
            </div>
        `;
        return;
    }

    filtered.forEach((bm) => {
        const examName = (EXAM_DATA[bm.exam] && EXAM_DATA[bm.exam].name) || bm.exam || '普通免許';
        const chatTurns = Array.isArray(bm.tutorHistory) ? Math.floor(bm.tutorHistory.length / 2) : 0;
        const savedDate = bm.savedAt ? bm.savedAt.slice(0, 10).replace(/-/g, '/') : '';
        const plainQuestion = (bm.question || '').replace(/[#*|>`\-]/g, ' ').replace(/\s+/g, ' ').trim();
        const typeTag = bm.type === 'hazard' ? '🚧 危険予測(2点)' : (bm.visual_type === 'sign' ? '🚦 標識SVG' : '⭕❌ ○×(1点)');

        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.innerHTML = `
            <div class="bookmark-card-header">
                <div class="bookmark-meta-badges">
                    <span class="bookmark-exam-badge">[${examName}] ${bm.category || ''}</span>
                    <span class="bookmark-exam-badge">${typeTag}</span>
                    ${chatTurns > 0 ? `<span class="bookmark-chat-badge">💬 AI教官チャット記録 (${chatTurns}件)</span>` : ''}
                </div>
                <span class="bookmark-date">${savedDate}</span>
            </div>
            <div class="bookmark-question-preview">${plainQuestion}</div>
            <div class="bookmark-card-actions">
                <button type="button" class="bookmark-action-btn primary-action btn-view-bm">📖 解説・チャットを見る</button>
                <button type="button" class="bookmark-action-btn btn-solve-bm">✍️ 問題を解く</button>
                <button type="button" class="bookmark-action-btn delete-action btn-delete-bm">🗑️ 削除</button>
            </div>
        `;

        card.querySelector('.btn-view-bm').addEventListener('click', () => openBookmarkItemWithExplanation(bm));
        card.querySelector('.btn-solve-bm').addEventListener('click', () => openBookmarkItemForPractice(bm));
        card.querySelector('.btn-delete-bm').addEventListener('click', () => {
            bookmarks = bookmarks.filter(item => !isSameQuiz(item, bm));
            localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
            updateBookmarkBtnState();
            renderBookmarkList();
            markLocalDataUpdated(true);
            showToast('ブックマークから削除しました');
        });
        bookmarkListContainer.appendChild(card);
    });
}

function openBookmarkItemForPractice(bm) {
    if (!bm) return;
    if (bookmarkModal) bookmarkModal.classList.add('hidden');
    isReviewMode = false;
    isBookmarkMode = true;
    resultSection.classList.add('hidden');
    displayQuiz(bm);
    quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openBookmarkItemWithExplanation(bm) {
    if (!bm) return;
    if (bookmarkModal) bookmarkModal.classList.add('hidden');
    isReviewMode = false;
    isBookmarkMode = true;
    displayQuiz(bm);
    isCurrentQuizAnswered = true;

    if (bm.visual_type === 'sign') {
        renderVisualSection(bm, true);
    }

    if (bm.type === 'hazard' && Array.isArray(bm.statements)) {
        if (submitHazardBtn) submitHazardBtn.classList.add('hidden');
        const cards = hazardStatementsList ? hazardStatementsList.querySelectorAll('.hazard-statement-card') : [];
        bm.statements.forEach((st, idx) => {
            const card = cards[idx];
            if (!card) return;
            card.classList.add('stmt-correct');
            const trueBtn = card.querySelector('.btn-hazard-true');
            const falseBtn = card.querySelector('.btn-hazard-false');
            if (trueBtn) trueBtn.disabled = true;
            if (falseBtn) falseBtn.disabled = true;
            if (st.answer === true && trueBtn) trueBtn.classList.add('is-active-true', 'is-correct-answer');
            if (st.answer === false && falseBtn) falseBtn.classList.add('is-active-false', 'is-correct-answer');
            const reasonBox = card.querySelector('.hazard-reason-box');
            if (reasonBox) {
                reasonBox.innerHTML = `<strong>[正解: ${st.answer ? '⭕ 正しい' : '❌ 誤り'}]</strong> ${st.reason || ''}`;
                reasonBox.classList.remove('hidden');
            }
        });
        if (answerSummaryBanner) {
            answerSummaryBanner.innerHTML = `<span>ブックマーク閲覧（危険予測 3設問・配点2点）</span>`;
            answerSummaryBanner.classList.remove('hidden');
        }
    } else {
        const correctBool = Boolean(bm.answer);
        [tfTrueBtn, tfFalseBtn].forEach(btn => {
            if (!btn) return;
            btn.disabled = true;
            if ((btn.dataset.val === 'true') === correctBool) btn.classList.add('correct');
        });
        if (answerSummaryBanner) {
            answerSummaryBanner.innerHTML = `<span>正解：<strong>${correctBool ? '⭕ 正しい (○)' : '❌ 誤り (×)'}</strong></span>`;
            answerSummaryBanner.classList.remove('hidden');
        }
    }

    resultSection.className = 'glass-card result-section result-correct';
    resultIcon.textContent = '🌟';
    resultTitle.textContent = 'ブックマーク（問題・解説・チャット記録）';
    explanationText.innerHTML = formatExplanationHTML(bm.explanation, bm);
    renderGroundingInfo(bm);
    updateBookmarkToggleUI();
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function startBookmarkPractice() {
    const filterVal = bookmarkFilterExam ? bookmarkFilterExam.value : 'all';
    const pool = filterVal === 'all' ? bookmarks : bookmarks.filter(b => b.exam === filterVal);
    if (pool.length === 0) {
        showToast('対象のブックマーク問題がありません');
        return;
    }
    if (bookmarkModal) bookmarkModal.classList.add('hidden');
    isReviewMode = false;
    isBookmarkMode = true;
    resultSection.classList.add('hidden');
    const randomBm = pool[Math.floor(Math.random() * pool.length)];
    displayQuiz(randomBm);
}

// ==========================================================================
// 学習データの外部バックアップ（JSONエクスポート＆インポート）
// ==========================================================================

function exportAllData() {
    const backupPayload = {
        app: 'DriveGenius',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        stats,
        mistakes,
        bookmarks
    };
    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drivegenius_backup_${getTodayString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 全学習データ（成績・シラバス進捗・復習・ブックマーク）を書き出しました');
}

function importAllData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed || typeof parsed !== 'object' || (!parsed.stats && !parsed.mistakes && !parsed.bookmarks)) {
                throw new Error('INVALID_BACKUP_FILE');
            }
            if (parsed.stats && typeof parsed.stats === 'object') {
                stats = normalizeStatsObject(parsed.stats);
                localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
            }
            if (Array.isArray(parsed.mistakes)) {
                mistakes = parsed.mistakes;
                localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify(mistakes));
            }
            if (Array.isArray(parsed.bookmarks)) {
                bookmarks = parsed.bookmarks;
                localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
            }
            renderStats();
            updateSubtopicsUI(true);
            renderSyllabusMiniBar();
            updateReviewBtnState();
            updateBookmarkBtnState();
            markLocalDataUpdated(true);
            showToast(`✅ バックアップを復元しました（ブックマーク${bookmarks.length}件・復習${mistakes.length}件）`);
        } catch (err) {
            console.error('[Backup Import Error]', err);
            showToast('⚠️ バックアップファイルの形式が正しくありません');
        }
    };
    reader.readAsText(file);
}

// ==========================================================================
// Googleドライブ自動クラウド同期 (Google Apps Script 連携)
// ==========================================================================

const GAS_TEMPLATE_CODE = `/**
 * DriveGenius v1.0.0 - Googleドライブ自動クラウド同期用バックエンド (Google Apps Script)
 */
const SECRET_TOKEN = 'CHANGE_THIS_TO_YOUR_SECRET'; // ← お好きな合言葉に変更してください
const FOLDER_NAME = 'DriveGenius_Sync';
const FILE_NAME = 'drivegenius_cloud_sync.json';

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, app: 'DriveGenius Cloud Sync', message: '正常に稼働しています。' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const req = JSON.parse(rawBody);
    if (!req.token || req.token !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: 'INVALID_TOKEN', message: '合言葉（シークレットトークン）が一致しません。' });
    }
    const action = req.action || 'load';
    if (action === 'ping') {
      const existing = readSyncFile();
      return jsonResponse({ ok: true, hasData: Boolean(existing), updatedAt: existing ? existing.updatedAt : null });
    }
    if (action === 'load') {
      const existing = readSyncFile();
      return jsonResponse({ ok: true, hasData: Boolean(existing), data: existing || null });
    }
    if (action === 'save') {
      if (!req.payload || typeof req.payload !== 'object') {
        return jsonResponse({ ok: false, error: 'INVALID_PAYLOAD', message: '保存データが不正です。' });
      }
      const savedAt = req.payload.updatedAt || new Date().toISOString();
      req.payload.updatedAt = savedAt;
      writeSyncFile(req.payload);
      return jsonResponse({ ok: true, updatedAt: savedAt });
    }
    return jsonResponse({ ok: false, error: 'UNKNOWN_ACTION', message: '不明なアクションです。' });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'SERVER_ERROR', message: String(err) });
  }
}

function getOrCreateSyncFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
}

function readSyncFile() {
  const folder = getOrCreateSyncFolder();
  const files = folder.getFilesByName(FILE_NAME);
  if (!files.hasNext()) return null;
  const content = files.next().getBlob().getDataAsString('UTF-8');
  return content ? JSON.parse(content) : null;
}

function writeSyncFile(dataObj) {
  const folder = getOrCreateSyncFolder();
  const jsonText = JSON.stringify(dataObj, null, 2);
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    files.next().setContent(jsonText);
  } else {
    folder.createFile(FILE_NAME, jsonText, MimeType.PLAIN_TEXT);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

function getCloudSyncConfig() {
    const url = (localStorage.getItem(STORAGE_KEYS.gasUrl) || '').trim();
    const token = (localStorage.getItem(STORAGE_KEYS.gasToken) || '').trim();
    return { url, token, enabled: Boolean(url && token) };
}

function hasLocalStudyData() {
    return (stats && stats.total > 0) || (mistakes && mistakes.length > 0) || (bookmarks && bookmarks.length > 0);
}

function formatSyncTimeShort(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        if (Number.isNaN(d.getTime())) return '';
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${mm}/${dd} ${hh}:${mi}`;
    } catch { return ''; }
}

function setCloudSyncStatus(state, detailText = '') {
    if (cloudSyncDot) cloudSyncDot.className = `sync-dot sync-dot-${state}`;
    const labelMap = {
        off: '未設定',
        syncing: '同期中...',
        ok: detailText ? `同期済 (${detailText})` : '同期済',
        error: detailText ? `エラー: ${detailText}` : '同期エラー'
    };
    const label = labelMap[state] || '未設定';
    if (cloudSyncHeaderBtn) {
        cloudSyncHeaderBtn.title = state === 'off'
            ? 'Googleドライブ自動クラウド同期（未設定：クリックで設定）'
            : `Googleドライブ自動クラウド同期：${label}（クリックで今すぐ同期）`;
    }
    if (cloudSyncModalStatus) {
        cloudSyncModalStatus.textContent = label;
        cloudSyncModalStatus.style.color = state === 'ok' ? '#34d399' : (state === 'error' ? '#f87171' : (state === 'syncing' ? '#38bdf8' : 'var(--text-secondary)'));
    }
    if (statsCloudStatusText) statsCloudStatusText.textContent = `☁️ クラウド同期: ${label}`;
}

async function callGasEndpoint(action, payload = null, overrideConfig = null) {
    const cfg = overrideConfig || getCloudSyncConfig();
    if (!cfg.url || !cfg.token) throw new Error('CLOUD_NOT_CONFIGURED');
    const bodyObj = { action, token: cfg.token };
    if (payload) bodyObj.payload = payload;

    const res = await fetch(cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyObj)
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    const data = await res.json();
    if (!data || !data.ok) {
        const errCode = (data && data.error) || 'SYNC_FAILED';
        const err = new Error(errCode);
        err.detail = (data && data.message) || errCode;
        throw err;
    }
    return data;
}

function buildCloudPayload() {
    const nowIso = localUpdatedAt || new Date().toISOString();
    return { app: 'DriveGenius', version: '1.0.0', updatedAt: nowIso, stats, mistakes, bookmarks };
}

function applyCloudPayload(cloudData) {
    if (!cloudData || typeof cloudData !== 'object') return;
    if (cloudData.stats && typeof cloudData.stats === 'object') {
        stats = normalizeStatsObject(cloudData.stats);
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
    }
    if (Array.isArray(cloudData.mistakes)) {
        mistakes = cloudData.mistakes;
        localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify(mistakes));
    }
    if (Array.isArray(cloudData.bookmarks)) {
        bookmarks = cloudData.bookmarks;
        localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
    }
    if (cloudData.updatedAt) {
        localUpdatedAt = cloudData.updatedAt;
        localStorage.setItem(STORAGE_KEYS.updatedAt, localUpdatedAt);
    }
    renderStats();
    updateSubtopicsUI(true);
    renderSyllabusMiniBar();
    updateReviewBtnState();
    updateBookmarkBtnState();
}

function markLocalDataUpdated(triggerAutoPush = true) {
    localUpdatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.updatedAt, localUpdatedAt);
    hasPendingTimeSync = false;

    const cfg = getCloudSyncConfig();
    if (!triggerAutoPush || !cfg.enabled || !cloudSyncReady) return;

    if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => {
        cloudSyncTimer = null;
        pushCloudData(false);
    }, 2000);
}

async function pushCloudData(showNotification = false, overrideConfig = null) {
    const cfg = overrideConfig || getCloudSyncConfig();
    if (!cfg.url || !cfg.token) {
        if (showNotification) showToast('⚙️ 設定画面でGAS URLと合言葉を設定してください');
        return false;
    }
    if (isCloudSyncing) return false;
    isCloudSyncing = true;
    setCloudSyncStatus('syncing');

    try {
        if (!localUpdatedAt) {
            localUpdatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.updatedAt, localUpdatedAt);
        }
        const res = await callGasEndpoint('save', buildCloudPayload(), cfg);
        cloudSyncReady = true;
        hasPendingTimeSync = false;
        setCloudSyncStatus('ok', formatSyncTimeShort(res.updatedAt || localUpdatedAt));
        if (showNotification) showToast('☁️ Googleドライブへ最新データを保存しました');
        return true;
    } catch (e) {
        const msg = e.message === 'INVALID_TOKEN' ? '合言葉が不一致' : '通信失敗';
        setCloudSyncStatus('error', msg);
        if (showNotification) showToast(`⚠️ クラウド保存エラー: ${e.detail || msg}`);
        return false;
    } finally {
        isCloudSyncing = false;
    }
}

async function pullCloudData(forceOverwrite = true, overrideConfig = null) {
    const cfg = overrideConfig || getCloudSyncConfig();
    if (!cfg.url || !cfg.token) {
        showToast('⚙️ 設定画面でGAS URLと合言葉を設定してください');
        return false;
    }
    if (isCloudSyncing) return false;
    isCloudSyncing = true;
    setCloudSyncStatus('syncing');

    try {
        const res = await callGasEndpoint('load', null, cfg);
        cloudSyncReady = true;
        if (!res.hasData || !res.data) {
            setCloudSyncStatus('ok', 'クラウド空');
            showToast('☁️ Googleドライブ上にまだ保存データがありません');
            return false;
        }
        if (forceOverwrite) applyCloudPayload(res.data);
        setCloudSyncStatus('ok', formatSyncTimeShort(res.data.updatedAt));
        showToast(`☁️ Googleドライブから最新データを読み込みました（${stats.total}問・ブックマーク${bookmarks.length}件）`);
        return true;
    } catch (e) {
        const msg = e.message === 'INVALID_TOKEN' ? '合言葉が不一致' : '通信失敗';
        setCloudSyncStatus('error', msg);
        showToast(`⚠️ クラウド読込エラー: ${e.detail || msg}`);
        return false;
    } finally {
        isCloudSyncing = false;
    }
}

async function syncCloudOnStartup(manualTrigger = false, overrideConfig = null) {
    const cfg = overrideConfig || getCloudSyncConfig();
    if (!cfg.url || !cfg.token) {
        cloudSyncReady = false;
        setCloudSyncStatus('off');
        return false;
    }
    if (isCloudSyncing) return false;
    isCloudSyncing = true;
    setCloudSyncStatus('syncing');

    try {
        const res = await callGasEndpoint('load', null, cfg);
        const cloudData = res.hasData ? res.data : null;
        const localHasData = hasLocalStudyData();

        if (cloudData) {
            const cloudTime = cloudData.updatedAt ? Date.parse(cloudData.updatedAt) : 0;
            const localTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;

            if (!localHasData || cloudTime > localTime) {
                applyCloudPayload(cloudData);
                cloudSyncReady = true;
                setCloudSyncStatus('ok', formatSyncTimeShort(cloudData.updatedAt));
                showToast(`☁️ Googleドライブから最新データを同期しました（${stats.total}問・ブックマーク${bookmarks.length}件）`);
                return true;
            }
            if (localTime > cloudTime) {
                const saveRes = await callGasEndpoint('save', buildCloudPayload(), cfg);
                cloudSyncReady = true;
                setCloudSyncStatus('ok', formatSyncTimeShort(saveRes.updatedAt || localUpdatedAt));
                if (manualTrigger) showToast('☁️ この端末の最新データをGoogleドライブへ同期しました');
                return true;
            }
            cloudSyncReady = true;
            setCloudSyncStatus('ok', formatSyncTimeShort(cloudData.updatedAt));
            if (manualTrigger) showToast('✅ Googleドライブとすでに最新状態です');
            return true;
        } else {
            cloudSyncReady = true;
            if (localHasData) {
                if (!localUpdatedAt) {
                    localUpdatedAt = new Date().toISOString();
                    localStorage.setItem(STORAGE_KEYS.updatedAt, localUpdatedAt);
                }
                const saveRes = await callGasEndpoint('save', buildCloudPayload(), cfg);
                setCloudSyncStatus('ok', formatSyncTimeShort(saveRes.updatedAt || localUpdatedAt));
                showToast('☁️ 現在の学習データをGoogleドライブへ初回保存しました');
            } else {
                setCloudSyncStatus('ok', '接続OK');
                if (manualTrigger) showToast('✅ Googleドライブとの接続に成功しました！問題を解くと自動保存されます');
            }
            return true;
        }
    } catch (e) {
        const msg = e.message === 'INVALID_TOKEN' ? '合言葉が不一致' : '接続失敗';
        setCloudSyncStatus('error', msg);
        if (manualTrigger) showToast(`⚠️ クラウド同期エラー: ${e.detail || 'GAS URL・デプロイ設定・合言葉をご確認ください'}`);
        return false;
    } finally {
        isCloudSyncing = false;
    }
}

function initCloudSyncUI() {
    const cfg = getCloudSyncConfig();
    if (gasUrlInput) gasUrlInput.value = cfg.url;
    if (gasTokenInput) gasTokenInput.value = cfg.token;
    if (gasCodePreview) gasCodePreview.textContent = GAS_TEMPLATE_CODE;

    if (cloudSyncHeaderBtn) {
        cloudSyncHeaderBtn.addEventListener('click', () => {
            const currentCfg = getCloudSyncConfig();
            if (!currentCfg.enabled) {
                if (apiModal) apiModal.classList.remove('hidden');
                if (gasUrlInput) setTimeout(() => gasUrlInput.focus(), 100);
            } else {
                syncCloudOnStartup(true);
            }
        });
    }

    if (openGasGuideBtn && gasGuideModal) {
        openGasGuideBtn.addEventListener('click', () => {
            gasGuideModal.classList.remove('hidden');
            const bodyEl = gasGuideModal.querySelector('.stats-modal-body');
            if (bodyEl) bodyEl.scrollTop = 0;
        });
    }
    if (closeGasGuideBtn && gasGuideModal) closeGasGuideBtn.addEventListener('click', () => gasGuideModal.classList.add('hidden'));
    if (closeGasGuideFooterBtn && gasGuideModal) closeGasGuideFooterBtn.addEventListener('click', () => gasGuideModal.classList.add('hidden'));
    if (gasGuideModal) {
        gasGuideModal.addEventListener('click', (e) => {
            if (e.target === gasGuideModal) gasGuideModal.classList.add('hidden');
        });
    }
    if (copyGasCodeBtn) {
        copyGasCodeBtn.addEventListener('click', () => copyTextToClipboard(GAS_TEMPLATE_CODE, '📋 GASコードをクリップボードにコピーしました！'));
    }

    if (testCloudSyncBtn) {
        testCloudSyncBtn.addEventListener('click', async () => {
            const url = gasUrlInput ? gasUrlInput.value.trim() : '';
            const token = gasTokenInput ? gasTokenInput.value.trim() : '';
            if (!url || !token) { showToast('GAS ウェブアプリ URL と合言葉の両方を入力してください'); return; }
            if (!url.startsWith('https://script.google.com/')) { showToast('⚠️ URLは https://script.google.com/... の形式で入力してください'); return; }
            localStorage.setItem(STORAGE_KEYS.gasUrl, url);
            localStorage.setItem(STORAGE_KEYS.gasToken, token);
            testCloudSyncBtn.disabled = true;
            await syncCloudOnStartup(true, { url, token, enabled: true });
            testCloudSyncBtn.disabled = false;
        });
    }

    if (statsCloudPushBtn) {
        statsCloudPushBtn.addEventListener('click', () => {
            if (!getCloudSyncConfig().enabled) {
                if (statsModal) statsModal.classList.add('hidden');
                if (apiModal) apiModal.classList.remove('hidden');
                showToast('⚙️ まずGAS URLと合言葉を設定してください');
                return;
            }
            pushCloudData(true);
        });
    }
    if (statsCloudPullBtn) {
        statsCloudPullBtn.addEventListener('click', () => {
            if (!getCloudSyncConfig().enabled) {
                if (statsModal) statsModal.classList.add('hidden');
                if (apiModal) apiModal.classList.remove('hidden');
                showToast('⚙️ まずGAS URLと合言葉を設定してください');
                return;
            }
            if (confirm('Googleドライブ上の最新データでこの端末のデータを上書き復元しますか？')) pullCloudData(true);
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && cloudSyncReady && hasPendingTimeSync) {
            pushCloudData(false);
        }
    });

    if (cfg.enabled) syncCloudOnStartup(false);
    else setCloudSyncStatus('off');
}

// ==========================================================================
// AI教習指導員チャット API呼び出し
// ==========================================================================

async function fetchTutorAnswer(userQuestion) {
    const engine = localStorage.getItem('ai_engine') || 'gemini';
    const apiKey = (localStorage.getItem(`${engine}_api_key`) || '').trim();
    if (!apiKey) {
        if (apiModal) apiModal.classList.remove('hidden');
        throw new Error('API Key missing');
    }

    const examName = (EXAM_DATA[currentQuiz.exam] && EXAM_DATA[currentQuiz.exam].name) || '普通免許 学科試験';
    const categoryName = currentQuiz.category || currentCategory;
    const useSearchGrounding = Boolean(searchGroundingCheckbox && searchGroundingCheckbox.checked && engine === 'gemini');

    let quizContext = `【対象試験・分野】${examName}（${categoryName}）\n`;
    if (currentQuiz.visual_type === 'sign' && currentQuiz.visual_id && ROAD_SIGNS[currentQuiz.visual_id]) {
        const s = ROAD_SIGNS[currentQuiz.visual_id];
        quizContext += `【図の標識・標示】${s.name}（${s.category}：${s.description}）\n`;
    } else if (currentQuiz.visual_type === 'hazard' && currentQuiz.visual_id && HAZARD_SCENES[currentQuiz.visual_id]) {
        const h = HAZARD_SCENES[currentQuiz.visual_id];
        quizContext += `【イラスト場面】${h.title}（${h.speed}）\n状況：${h.situation}\n`;
    }

    quizContext += `【問題文】\n${currentQuiz.question}\n`;
    if (currentQuiz.type === 'hazard' && Array.isArray(currentQuiz.statements)) {
        quizContext += `【3設問と正解】\n` + currentQuiz.statements.map((st, idx) =>
            `${idx + 1}. ${st.text} → 正解: ${st.answer ? '⭕正しい' : '❌誤り'}（${st.reason || ''}）`
        ).join('\n') + `\n`;
    } else {
        quizContext += `【正解】${currentQuiz.answer ? '⭕ 正しい (○)' : '❌ 誤り (×)'}\n`;
    }
    quizContext += `【解説】\n${currentQuiz.explanation}\n`;

    let historyText = '';
    if (currentTutorHistory.length > 0) {
        historyText = '\n【これまでの質疑応答】\n' + currentTutorHistory.map(h => `${h.role === 'user' ? '教習生' : '指導員'}: ${h.content}`).join('\n\n') + '\n';
    }

    const tutorPrompt = `あなたは日本の指定自動車教習所のベテラン学科教官（指導員）です。
現在、普通自動車免許の学科試験対策をしている教習生が、以下の問題と解説を読んだうえで質問しています。

${TRAFFIC_LAW_REFERENCE}

${quizContext}${historyText}
【教習生からの質問】
${userQuestion}

【回答のルール】
- 道路交通法に基づき正確に、かつ初心者にもイメージしやすい具体例や比較表を使って分かりやすく回答してください。
- 本試験で引っかかりやすい言い回し（徐行 vs 一時停止、〜しなければならない vs 〜することができる、5m vs 10m等）があれば明示してください。
- JSONではなく、そのまま読めるMarkdownテキストとして出力してください。`;

    if (engine === 'gemini') {
        const geminiModels = ['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
        let lastErr = null;
        for (const model of geminiModels) {
            try {
                const isGemini4 = model.startsWith('gemini-4');
                const reqBody = { contents: [{ parts: [{ text: tutorPrompt }] }] };
                if (!isGemini4) reqBody.generationConfig = { temperature: 0.5 };
                if (useSearchGrounding) reqBody.tools = [{ google_search: {} }];
                let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody)
                });
                if (!res.ok && res.status === 400 && useSearchGrounding && !isGemini4) {
                    delete reqBody.tools;
                    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reqBody)
                    });
                }
                if (!res.ok) {
                    if (res.status === 401) throw new Error('AUTH_ERROR');
                    if (res.status === 429) await new Promise(r => setTimeout(r, 1200));
                    lastErr = selectPriorityError(lastErr, new Error(res.status === 429 ? 'RATE_LIMIT' : 'SERVER_OVERLOAD'));
                    continue;
                }
                const data = await res.json();
                const parts = data?.candidates?.[0]?.content?.parts || [];
                const text = parts.filter(p => !p.thought).map(p => p.text || '').join('\n').trim();
                if (text) return text;
            } catch (e) {
                if (e.message === 'AUTH_ERROR') throw e;
                lastErr = selectPriorityError(lastErr, e);
            }
        }
        throw lastErr || new Error('SERVER_OVERLOAD');
    }

    if (engine === 'groq') {
        const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
        let lastErr = null;
        for (const model of groqModels) {
            try {
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model, messages: [{ role: 'user', content: tutorPrompt }], temperature: 0.5 })
                });
                if (!res.ok) {
                    if (res.status === 401) throw new Error('AUTH_ERROR');
                    if (res.status === 429) await new Promise(r => setTimeout(r, 1200));
                    lastErr = selectPriorityError(lastErr, new Error(res.status === 429 ? 'RATE_LIMIT' : 'SERVER_OVERLOAD'));
                    continue;
                }
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content?.trim();
                if (text) return text;
            } catch (e) {
                if (e.message === 'AUTH_ERROR') throw e;
                lastErr = selectPriorityError(lastErr, e);
            }
        }
        throw lastErr || new Error('SERVER_OVERLOAD');
    }

    if (engine === 'openrouter') {
        const freeModels = ['openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-3-27b-it:free', 'deepseek/deepseek-r1:free'];
        let lastErr = null;
        for (const model of freeModels) {
            try {
                const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': window.location.href || 'http://localhost',
                        'X-Title': 'DriveGenius'
                    },
                    body: JSON.stringify({ model, messages: [{ role: 'user', content: tutorPrompt }], temperature: 0.5 })
                });
                if (!res.ok) {
                    const errBody = await res.text().catch(() => '');
                    if (res.status === 401) throw new Error('AUTH_ERROR');
                    if (res.status === 429) await new Promise(r => setTimeout(r, 1200));
                    if (res.status === 404 && (errBody.includes('data policy') || errBody.includes('Privacy'))) {
                        lastErr = selectPriorityError(lastErr, new Error('OPENROUTER_PRIVACY_404'));
                        continue;
                    }
                    lastErr = selectPriorityError(lastErr, new Error(res.status === 429 ? 'RATE_LIMIT' : 'SERVER_OVERLOAD'));
                    continue;
                }
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content?.trim();
                if (text) return text;
            } catch (e) {
                if (e.message === 'AUTH_ERROR') throw e;
                lastErr = selectPriorityError(lastErr, e);
            }
        }
        throw lastErr || new Error('SERVER_OVERLOAD');
    }

    const openaiModels = ['gpt-4o-mini', 'gpt-4.1-mini'];
    let lastErr = null;
    for (const model of openaiModels) {
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model, messages: [{ role: 'user', content: tutorPrompt }], temperature: 0.5 })
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error('AUTH_ERROR');
                lastErr = new Error(res.status === 429 ? 'RATE_LIMIT' : 'SERVER_OVERLOAD');
                continue;
            }
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content?.trim();
            if (text) return text;
        } catch (e) {
            if (e.message === 'AUTH_ERROR') throw e;
            lastErr = e;
        }
    }
    throw lastErr || new Error('SERVER_OVERLOAD');
}

function renderChangelog() {
    if (!changelogList) return;
    changelogList.innerHTML = '';
    CHANGELOG_DATA.forEach((item) => {
        const itemEl = document.createElement('div');
        itemEl.className = `changelog-item ${item.latest ? 'latest' : ''}`;
        const ul = document.createElement('ul');
        item.items.forEach(liText => {
            const li = document.createElement('li');
            li.textContent = liText;
            ul.appendChild(li);
        });
        itemEl.innerHTML = `
            <div class="changelog-item-header">
                <span class="changelog-ver">${item.version}</span>
                <span class="changelog-tag ${item.latest ? 'latest-tag' : ''}">${item.tag}</span>
                <span class="changelog-date">${item.date}</span>
            </div>
            <div class="changelog-desc"></div>
        `;
        itemEl.querySelector('.changelog-desc').appendChild(ul);
        changelogList.appendChild(itemEl);
    });
}

// ==========================================================================
// 統計・復習ストック更新
// ==========================================================================

function updateStatsAndMistakes(isCorrect) {
    stats.total += 1;
    if (isCorrect) stats.correct += 1;

    const catKey = `${currentQuiz.exam}_${currentQuiz.category}`;
    if (!stats.categories[catKey]) stats.categories[catKey] = { total: 0, correct: 0 };
    stats.categories[catKey].total += 1;
    if (isCorrect) stats.categories[catKey].correct += 1;

    if (!stats.subtopics) stats.subtopics = {};
    if (currentQuiz.subtopic) {
        const subKey = getSubtopicKey(currentQuiz.exam, currentQuiz.category, currentQuiz.subtopic);
        if (!stats.subtopics[subKey]) stats.subtopics[subKey] = { total: 0, correct: 0, lastAt: null };
        stats.subtopics[subKey].total += 1;
        if (isCorrect) stats.subtopics[subKey].correct += 1;
        stats.subtopics[subKey].lastAt = new Date().toISOString();
    }

    if (!stats.formatStats) stats.formatStats = createDefaultFormatStats();
    const recordFmt = (key) => {
        if (!stats.formatStats[key]) stats.formatStats[key] = { total: 0, correct: 0 };
        stats.formatStats[key].total += 1;
        if (isCorrect) stats.formatStats[key].correct += 1;
    };

    if (currentQuiz.type === 'hazard') {
        recordFmt('hazard');
    } else if (currentQuiz.visual_type === 'sign') {
        recordFmt('sign');
    } else {
        recordFmt('tf');
    }
    if (currentQuiz.isTrick) {
        recordFmt('trick');
    }

    const todayStr = getTodayString();
    if (!stats.dailyHistory) stats.dailyHistory = {};
    if (!stats.dailyHistory[todayStr]) stats.dailyHistory[todayStr] = { count: 0, time: 0 };
    stats.dailyHistory[todayStr].count += 1;

    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
    updateSubtopicsUI(true);
    renderSyllabusMiniBar();

    if (!isCorrect && !isReviewMode) {
        if (!mistakes.some(m => isSameQuiz(m, currentQuiz))) {
            mistakes.push(currentQuiz);
            localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify(mistakes));
            showToast('間違えた問題として復習ストックに追加しました');
        }
    } else if (isCorrect && isReviewMode) {
        if (currentQuiz.mistakeIndex !== undefined) {
            mistakes.splice(currentQuiz.mistakeIndex, 1);
            localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify(mistakes));
            showToast('正解しました！復習ストックから消化されました');
        }
    }
    updateReviewBtnState();
    markLocalDataUpdated(true);
}

// ==========================================================================
// シラバス網羅マップ＆傾向分析モーダル
// ==========================================================================

function openSyllabusModal() {
    if (!syllabusModal) return;
    if (syllabusExamSelect) {
        syllabusExamSelect.value = examSelect.value || 'honmen';
        populateSyllabusCategoryFilter(syllabusExamSelect.value);
    }
    renderSyllabusModal();
    syllabusModal.classList.remove('hidden');
    const bodyEl = syllabusModal.querySelector('.syllabus-modal-body');
    if (bodyEl) bodyEl.scrollTop = 0;
}

function populateSyllabusCategoryFilter(examKey) {
    if (!syllabusCategoryFilter) return;
    const categories = (EXAM_DATA[examKey] && EXAM_DATA[examKey].categories) || [];
    syllabusCategoryFilter.innerHTML = '<option value="all">すべての出題分野を表示</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        syllabusCategoryFilter.appendChild(opt);
    });
}

async function startSubtopicQuiz(examKey, categoryName, subtopicName) {
    if (syllabusModal) syllabusModal.classList.add('hidden');
    stopSpeaking();
    cancelBackgroundPrefetch();

    if (examSelect.value !== examKey) {
        examSelect.value = examKey;
        updateCategories();
    }
    if (categorySelect.value !== categoryName) {
        categorySelect.value = categoryName;
        currentCategory = categoryName;
        updateSubtopicsUI();
    }

    const subList = getSubtopicsForCategory(examKey, categoryName);
    const subIdx = subList.indexOf(subtopicName);
    if (subtopicSelect && subIdx >= 0) subtopicSelect.value = `subtopic::${subIdx}`;
    renderSyllabusMiniBar();

    isReviewMode = false;
    isBookmarkMode = false;
    setLoading(true);
    quizSection.classList.add('hidden');
    resultSection.classList.add('hidden');

    try {
        const data = await fetchQuizData({ forceSubtopic: subtopicName });
        displayQuiz(data);
        quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
        console.error('[DriveGenius Subtopic Start Error]', e);
        showToast(formatUserErrorMessage(e));
    } finally {
        setLoading(false);
    }
}

function renderSyllabusModal() {
    if (!syllabusMapContainer) return;
    const examKey = syllabusExamSelect ? syllabusExamSelect.value : currentExam;
    const catFilter = syllabusCategoryFilter ? syllabusCategoryFilter.value : 'all';
    const examInfo = EXAM_DATA[examKey];
    if (!examInfo) return;

    const allCategories = examInfo.categories || [];
    const targetCategories = catFilter === 'all' ? allCategories : allCategories.filter(c => c === catFilter);

    let totalSubCount = 0;
    let masteredCount = 0;
    let learningCount = 0;
    let weakCount = 0;
    let unstudiedCount = 0;

    const allSubItems = [];
    allCategories.forEach(cat => {
        const subs = getSubtopicsForCategory(examKey, cat);
        subs.forEach((sub, idx) => {
            const rec = getSubtopicRecord(examKey, cat, sub);
            const state = getSubtopicState(examKey, cat, sub);
            allSubItems.push({ examKey, category: cat, subtopic: sub, idx, rec, state });
            if (catFilter === 'all' || cat === catFilter) {
                totalSubCount++;
                if (state === 'mastered') masteredCount++;
                else if (state === 'learning') learningCount++;
                else if (state === 'weak') weakCount++;
                else unstudiedCount++;
            }
        });
    });

    const touchedCount = masteredCount + learningCount + weakCount;
    const coveragePct = totalSubCount > 0 ? Math.round((touchedCount / totalSubCount) * 100) : 0;

    if (syllabusOverallTitle) {
        syllabusOverallTitle.textContent = catFilter === 'all'
            ? `${examInfo.name} 全体の学習現在地（全${allCategories.length}分野・${totalSubCount}論点）`
            : `${examInfo.name} ＞ ${catFilter} の学習現在地（${totalSubCount}論点）`;
    }
    if (syllabusOverallPercent) syllabusOverallPercent.textContent = `着手率 ${coveragePct}% (${touchedCount} / ${totalSubCount} 論点)`;
    if (syllabusMasteredBar) syllabusMasteredBar.style.width = totalSubCount > 0 ? `${(masteredCount / totalSubCount) * 100}%` : '0%';
    if (syllabusLearningBar) syllabusLearningBar.style.width = totalSubCount > 0 ? `${(learningCount / totalSubCount) * 100}%` : '0%';
    if (syllabusWeakBar) syllabusWeakBar.style.width = totalSubCount > 0 ? `${(weakCount / totalSubCount) * 100}%` : '0%';
    if (countMastered) countMastered.textContent = masteredCount;
    if (countLearning) countLearning.textContent = learningCount;
    if (countWeak) countWeak.textContent = weakCount;
    if (countUnstudied) countUnstudied.textContent = unstudiedCount;

    if (weakSubtopicsList) {
        weakSubtopicsList.innerHTML = '';
        const scopedItems = allSubItems.filter(it => catFilter === 'all' || it.category === catFilter);
        const attemptedProblems = scopedItems
            .filter(it => it.rec.total > 0 && (it.rec.correct / it.rec.total) < 0.8)
            .sort((a, b) => {
                const accA = a.rec.correct / a.rec.total;
                const accB = b.rec.correct / b.rec.total;
                return accA !== accB ? accA - accB : b.rec.total - a.rec.total;
            })
            .slice(0, 5);

        if (attemptedProblems.length === 0) {
            const p = document.createElement('p');
            p.className = 'trend-empty';
            p.textContent = touchedCount === 0
                ? 'まだ解答データがありません。下のマップまたは出題画面から問題を解くと弱点論点を自動抽出します。'
                : '🎉 現在、正答率80%未満の弱点論点はありません！未学習論点の塗りつぶしを進めましょう。';
            weakSubtopicsList.appendChild(p);
        } else {
            attemptedProblems.forEach(item => {
                const acc = Math.round((item.rec.correct / item.rec.total) * 100);
                const row = document.createElement('div');
                row.className = 'trend-item';
                row.innerHTML = `
                    <div class="trend-item-info">
                        <span class="trend-item-cat">${item.category}</span>
                        <span class="trend-item-name" title="${item.subtopic}">${item.subtopic}</span>
                        <span class="trend-item-metrics">${acc < 50 ? '🟥 要復習' : '🟨 学習中'}: 正答率 ${acc}% (${item.rec.correct}/${item.rec.total}問)</span>
                    </div>
                    <button type="button" class="trend-item-btn">🎯 特訓出題</button>
                `;
                row.querySelector('.trend-item-btn').addEventListener('click', () => startSubtopicQuiz(item.examKey, item.category, item.subtopic));
                weakSubtopicsList.appendChild(row);
            });
        }
    }

    if (formatTendencySummary) {
        const fs = stats.formatStats || createDefaultFormatStats();
        const fmtAcc = (obj) => (obj && obj.total > 0 ? `${Math.round((obj.correct / obj.total) * 100)}% (${obj.correct}/${obj.total})` : '未解答');

        const catPerf = [];
        allCategories.forEach(cat => {
            const cData = stats.categories[`${examKey}_${cat}`];
            if (cData && cData.total > 0) catPerf.push({ cat, acc: Math.round((cData.correct / cData.total) * 100), total: cData.total });
        });
        catPerf.sort((a, b) => a.acc - b.acc);

        let adviceText = '各分野をまんべんなく演習し、本試験合格ライン（90%以上）を目指して⬜未学習タイルを🟩マスター済へ塗りつぶしていきましょう。';
        if (fs.sign && fs.sign.total >= 2 && (fs.sign.correct / fs.sign.total) * 100 < 80) {
            adviceText = '💡 道路標識・標示問題で取りこぼしが見られます。「道路標識・標示 マスター」コースで紛らわしいペアを重点演習するのが効果的です。';
        } else if (fs.hazard && fs.hazard.total >= 2 && (fs.hazard.correct / fs.hazard.total) * 100 < 80) {
            adviceText = '💡 危険予測問題（1問2点）は3設問すべて正解しないと0点になります。「危険予測イラスト問題」コースで死角・飛び出しの考え方を固めましょう。';
        } else if (fs.trick && fs.trick.total >= 2 && (fs.trick.correct / fs.trick.total) * 100 < 80) {
            adviceText = '💡 ひっかけ・数値問題で失点傾向があります。「⚠️ ひっかけ・数値ルールを優先」をONにして5m/10mや例外規定を固めましょう。';
        } else if (catPerf.length >= 2 && catPerf[0].acc < 80) {
            adviceText = `💡 分野別では「${catPerf[0].cat}」（正答率 ${catPerf[0].acc}%）が合格ライン(90%)へ向けた最優先補強分野です。`;
        }

        formatTendencySummary.innerHTML = `
            <div class="tendency-row"><span>⭕❌ 文章○×問題（1点）</span><strong>${fmtAcc(fs.tf)}</strong></div>
            <div class="tendency-row"><span>🚦 道路標識・標示問題</span><strong>${fmtAcc(fs.sign)}</strong></div>
            <div class="tendency-row"><span>🚧 危険予測3連○×（2点）</span><strong>${fmtAcc(fs.hazard)}</strong></div>
            <div class="tendency-row"><span>⚠️ ひっかけ・数値特訓</span><strong>${fmtAcc(fs.trick)}</strong></div>
            <div class="tendency-advice">${adviceText}</div>
        `;
    }

    if (unstudiedSubtopicsList) {
        unstudiedSubtopicsList.innerHTML = '';
        const scopedUnstudied = allSubItems.filter(it => (catFilter === 'all' || it.category === catFilter) && it.state === 'unstudied');
        if (scopedUnstudied.length === 0) {
            const p = document.createElement('p');
            p.className = 'trend-empty';
            p.textContent = '🎉 この範囲のすべての論点に着手済みです！全論点🟩マスター（正答率80%↑）を目指しましょう！';
            unstudiedSubtopicsList.appendChild(p);
        } else {
            const picked = [];
            const seenCats = new Set();
            for (const item of scopedUnstudied) {
                if (!seenCats.has(item.category) && picked.length < 4) {
                    picked.push(item);
                    seenCats.add(item.category);
                }
            }
            for (const item of scopedUnstudied) {
                if (picked.length >= 4) break;
                if (!picked.includes(item)) picked.push(item);
            }
            picked.forEach(item => {
                const row = document.createElement('div');
                row.className = 'trend-item';
                row.innerHTML = `
                    <div class="trend-item-info">
                        <span class="trend-item-cat">${item.category}</span>
                        <span class="trend-item-name" title="${item.subtopic}">${item.subtopic}</span>
                    </div>
                    <button type="button" class="trend-item-btn">🚀 出題する</button>
                `;
                row.querySelector('.trend-item-btn').addEventListener('click', () => startSubtopicQuiz(item.examKey, item.category, item.subtopic));
                unstudiedSubtopicsList.appendChild(row);
            });
        }
    }

    syllabusMapContainer.innerHTML = '';
    targetCategories.forEach(cat => {
        const subs = getSubtopicsForCategory(examKey, cat);
        let catTouched = 0;
        let catMastered = 0;
        subs.forEach(s => {
            const st = getSubtopicState(examKey, cat, s);
            if (st !== 'unstudied') catTouched++;
            if (st === 'mastered') catMastered++;
        });
        const catPct = subs.length > 0 ? Math.round((catTouched / subs.length) * 100) : 0;

        const block = document.createElement('div');
        block.className = 'syllabus-category-block';
        const header = document.createElement('div');
        header.className = 'syllabus-category-header';
        header.innerHTML = `
            <span class="syllabus-category-title">📂 ${cat}</span>
            <span class="syllabus-category-progress">網羅 ${catTouched}/${subs.length}論点 (${catPct}%) ｜ 🟩マスター ${catMastered}</span>
        `;
        block.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'syllabus-tiles-grid';

        subs.forEach((sub, idx) => {
            const rec = getSubtopicRecord(examKey, cat, sub);
            const state = getSubtopicState(examKey, cat, sub);
            const sym = getSubtopicStateSymbol(state);
            const stateLabel = state === 'mastered' ? 'マスター済' : (state === 'weak' ? '要復習・弱点' : (state === 'learning' ? '学習中' : '未学習'));
            const statText = rec.total > 0 ? `正答率 ${Math.round((rec.correct / rec.total) * 100)}% (${rec.correct}/${rec.total}問)` : 'まだ解いていません';

            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = `syllabus-tile state-${state}`;
            tile.innerHTML = `
                <div class="tile-top-row">
                    <span class="tile-title">${idx + 1}. ${sub}</span>
                    <span class="tile-status-tag">${sym} ${stateLabel}</span>
                </div>
                <div class="tile-bottom-row">
                    <span>${statText}</span>
                    <span class="tile-action-hint">▶ 出題</span>
                </div>
            `;
            tile.addEventListener('click', () => startSubtopicQuiz(examKey, cat, sub));
            grid.appendChild(tile);
        });

        block.appendChild(grid);
        syllabusMapContainer.appendChild(block);
    });
}

function renderStats() {
    const totalStat = document.getElementById('totalQuestionsStat');
    const accStat = document.getElementById('overallAccuracyStat');
    const todayStudyTimeStat = document.getElementById('todayStudyTimeStat');
    const list = document.getElementById('categoryStatsList');

    if (totalStat) totalStat.textContent = stats.total;
    const overallAcc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    if (accStat) accStat.textContent = `${overallAcc}%`;

    const todayStr = getTodayString();
    const todayData = (stats.dailyHistory && stats.dailyHistory[todayStr]) || { time: 0 };
    const todayMin = Math.floor((todayData.time || 0) / 60);
    const todaySec = (todayData.time || 0) % 60;
    if (todayStudyTimeStat) todayStudyTimeStat.textContent = `${todayMin}分 ${todaySec}秒`;

    renderWeeklyChart();
    if (!list) return;
    list.innerHTML = '';

    if (stats.total === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">まだデータがありません</p>';
        return;
    }

    const sortedCats = Object.entries(stats.categories).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
    sortedCats.forEach(([catKey, data]) => {
        const sepIdx = catKey.indexOf('_');
        const exam = sepIdx >= 0 ? catKey.slice(0, sepIdx) : catKey;
        const cat = sepIdx >= 0 ? catKey.slice(sepIdx + 1) : '';
        const examName = getExamShortLabel(exam);
        const acc = Math.round((data.correct / data.total) * 100);

        let color = 'var(--error-color)';
        if (acc >= 90) color = 'var(--success-color)';
        else if (acc >= 70) color = '#fbbf24';

        const item = document.createElement('div');
        item.className = 'category-stat-item';
        item.innerHTML = `
            <div class="category-stat-header">
                <span><small>[${examName}]</small> ${cat}</span>
                <span>${acc}% (${data.correct}/${data.total})</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${acc}%; background: ${color}"></div>
            </div>
        `;
        list.appendChild(item);
    });
}

// --- 音声読み上げ & 学習時間 & グラフ ---

function getTodayString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function updateTodayStudyTimeData() {
    const todayStr = getTodayString();
    if (!stats.dailyHistory) stats.dailyHistory = {};
    if (!stats.dailyHistory[todayStr]) stats.dailyHistory[todayStr] = { count: 0, time: 0 };
    stats.dailyHistory[todayStr].time += 1;

    if (sessionSeconds % 5 === 0) {
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
        hasPendingTimeSync = true;
    }
    if (sessionSeconds > 0 && sessionSeconds % 60 === 0 && cloudSyncReady && hasPendingTimeSync) {
        localUpdatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.updatedAt, localUpdatedAt);
        pushCloudData(false);
    }
}

function startSpeaking() {
    if (!currentQuiz || !currentQuiz.explanation) return;
    window.speechSynthesis.cancel();

    let prefix = '';
    if (currentQuiz.type === 'hazard' && Array.isArray(currentQuiz.statements)) {
        prefix = currentQuiz.statements.map((st, i) => `設問${i + 1}、${st.answer ? '正しい' : '誤り'}。${st.reason || ''}`).join(' ');
    } else {
        prefix = `正解は、${currentQuiz.answer ? '正しい、まる' : '誤り、ばつ'}です。`;
    }

    let textToSpeak = `${prefix}\n解説を読み上げます。${currentQuiz.explanation}`
        .replace(/#+/g, '')
        .replace(/\*+/g, '')
        .replace(/`+/g, '')
        .replace(/[⭕❌○◯×✕]/g, '')
        .replace(/【/g, '\n【');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ja-JP';
    utterance.rate = ttsSpeed ? parseFloat(ttsSpeed.value) : 1.0;

    utterance.onend = () => {
        isSpeaking = false;
        if (ttsBtn) ttsBtn.querySelector('.btn-text').textContent = '🔊 解説を読み上げる';
    };
    utterance.onerror = () => {
        isSpeaking = false;
        if (ttsBtn) ttsBtn.querySelector('.btn-text').textContent = '🔊 解説を読み上げる';
    };

    window.speechSynthesis.speak(utterance);
    isSpeaking = true;
    if (ttsBtn) ttsBtn.querySelector('.btn-text').textContent = '⏹ 読み上げを停止';
}

function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isSpeaking = false;
    if (ttsBtn) {
        const btnTextSpan = ttsBtn.querySelector('.btn-text');
        if (btnTextSpan) btnTextSpan.textContent = '🔊 解説を読み上げる';
    }
}

function renderWeeklyChart() {
    const chartContainer = document.getElementById('weeklyChartContainer');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        days.push({ dateStr: `${y}-${m}-${day}`, labelStr: `${d.getMonth() + 1}/${d.getDate()}` });
    }

    let maxTime = 1800;
    days.forEach(day => {
        const hist = stats.dailyHistory[day.dateStr] || { time: 0 };
        if (hist.time > maxTime) maxTime = hist.time;
    });

    const chartDiv = document.createElement('div');
    chartDiv.className = 'weekly-chart';
    const barsDiv = document.createElement('div');
    barsDiv.className = 'chart-bars';

    days.forEach(day => {
        const hist = stats.dailyHistory[day.dateStr] || { count: 0, time: 0 };
        const minutes = Math.round((hist.time || 0) / 60);
        const percent = Math.min(100, Math.max(0, ((hist.time || 0) / maxTime) * 100));
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';
        const valueText = minutes > 0 ? `${minutes}分` : '0分';
        const tooltipText = `${hist.count || 0}問完了 (学習時間: ${valueText})`;
        wrapper.innerHTML = `
            <div class="chart-bar-value">${valueText}</div>
            <div class="chart-bar" style="height: ${percent}%;" title="${tooltipText}"></div>
            <div class="chart-bar-label">${day.labelStr}</div>
        `;
        barsDiv.appendChild(wrapper);
    });

    chartDiv.appendChild(barsDiv);
    chartContainer.appendChild(chartDiv);
}

// Start app
init();
