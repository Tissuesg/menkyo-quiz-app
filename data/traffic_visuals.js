// ==========================================================================
// DriveGenius: 日本の道路標識・道路標示 & 危険予測イラスト SVGライブラリ
// ==========================================================================

window.ROAD_SIGNS = {
    // --- 規制標識 ---
    stop: {
        id: 'stop',
        name: '一時停止（止まれ）',
        category: '規制標識',
        description: '赤い逆三角形に白縁・白文字で「止まれ」（英語併記 STOP）',
        keyRule: '停止線があるときはその直前、ないときは交差点の直前で必ず一時停止しなければならない（徐行では不可）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="一時停止標識">
            <polygon points="10,20 110,20 60,108" fill="#d9232e" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>
            <polygon points="10,20 110,20 60,108" fill="none" stroke="#991b1b" stroke-width="1.5" stroke-linejoin="round"/>
            <text x="60" y="45" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="800" font-family="sans-serif">止まれ</text>
            <text x="60" y="65" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700" font-family="sans-serif" letter-spacing="1">STOP</text>
        </svg>`
    },
    slow: {
        id: 'slow',
        name: '徐行',
        category: '規制標識',
        description: '白地の逆三角形に赤い太枠、青文字で「徐行」',
        keyRule: '車両等は直ちに停止できるような速度（おおむね時速10km以下が目安）で進行しなければならない。一時停止義務ではない。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="徐行標識">
            <polygon points="10,20 110,20 60,108" fill="#ffffff" stroke="#d9232e" stroke-width="10" stroke-linejoin="round"/>
            <text x="60" y="47" text-anchor="middle" fill="#005bac" font-size="19" font-weight="800" font-family="sans-serif">徐行</text>
            <text x="60" y="66" text-anchor="middle" fill="#005bac" font-size="10" font-weight="700" font-family="sans-serif">SLOW</text>
        </svg>`
    },
    no_entry: {
        id: 'no_entry',
        name: '車両進入禁止',
        category: '規制標識',
        description: '赤い円の中央に白い横一本の棒（進入禁止）',
        keyRule: '主に一方通行の出口などに設置され、標識の向かい側からの車両の進入を禁止する。歩行者は通行できる。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="車両進入禁止標識">
            <circle cx="60" cy="60" r="50" fill="#d9232e" stroke="#ffffff" stroke-width="3"/>
            <rect x="20" y="50" width="80" height="20" rx="2" fill="#ffffff"/>
        </svg>`
    },
    no_vehicles: {
        id: 'no_vehicles',
        name: '通行止め',
        category: '規制標識',
        description: '白地の円に赤い枠と赤い×（バツ）印',
        keyRule: '歩行者も車も路面電車もすべて通行が禁止される。「車両通行止め（斜線1本）」と異なり歩行者も通れない。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="通行止め標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="11"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="11" stroke-linecap="round"/>
            <line x1="93" y1="27" x2="27" y2="93" stroke="#d9232e" stroke-width="11" stroke-linecap="round"/>
        </svg>`
    },
    no_motor_vehicles: {
        id: 'no_motor_vehicles',
        name: '車両通行止め',
        category: '規制標識',
        description: '白地の円に赤い枠と赤い斜線1本',
        keyRule: '自動車・原付・軽車両（自転車など）の通行が禁止される。歩行者は通行できる（押し歩きする自転車等も補助標識がなければ歩行者扱いになる場合があるが、軽車両としては通行不可）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="車両通行止め標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="11"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="11" stroke-linecap="round"/>
        </svg>`
    },
    no_stopping: {
        id: 'no_stopping',
        name: '駐停車禁止',
        category: '規制標識',
        description: '青地の円に赤い枠と赤い×（バツ）印',
        keyRule: '駐車も停車もどちらも禁止される。人の乗り降りや5分以内の荷物の積みおろしのための短時間停止も原則不可。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="駐停車禁止標識">
            <circle cx="60" cy="60" r="46" fill="#005bac" stroke="#d9232e" stroke-width="11"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="11" stroke-linecap="round"/>
            <line x1="93" y1="27" x2="27" y2="93" stroke="#d9232e" stroke-width="11" stroke-linecap="round"/>
        </svg>`
    },
    no_parking: {
        id: 'no_parking',
        name: '駐車禁止',
        category: '規制標識',
        description: '青地の円に赤い枠と赤い斜線1本',
        keyRule: '駐車は禁止されるが、人の乗り降りや5分以内の荷物の積みおろしなどの「停車」は禁止されない。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="駐車禁止標識">
            <circle cx="60" cy="60" r="46" fill="#005bac" stroke="#d9232e" stroke-width="11"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="11" stroke-linecap="round"/>
        </svg>`
    },
    speed_40: {
        id: 'speed_40',
        name: '最高速度（40km/h）',
        category: '規制標識',
        description: '白地の円に赤い枠、青い数字「40」',
        keyRule: '車と路面電車はこの数字（時速40km）を超えて運転してはならない。なお原動機付自転車の法定最高速度は30km/hなので原付は30km/hが上限。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="最高速度40標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="11"/>
            <text x="60" y="75" text-anchor="middle" fill="#005bac" font-size="44" font-weight="800" font-family="sans-serif">40</text>
        </svg>`
    },
    speed_50: {
        id: 'speed_50',
        name: '最高速度（50km/h）',
        category: '規制標識',
        description: '白地の円に赤い枠、青い数字「50」',
        keyRule: '指定最高速度50km/h。一般道でも高速道路でも、標識による指定速度が法定速度より優先される（ただし原付の上限は30km/h）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="最高速度50標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="11"/>
            <text x="60" y="75" text-anchor="middle" fill="#005bac" font-size="44" font-weight="800" font-family="sans-serif">50</text>
        </svg>`
    },
    no_overtaking_lane: {
        id: 'no_overtaking_lane',
        name: '追越しのための右側部分はみ出し通行禁止',
        category: '規制標識',
        description: '左から右の車を追い越して右矢印に戻る図柄に赤い斜線',
        keyRule: '追越し自体は禁止されていない（道路の中央から右側部分にはみ出さずに追越しできるなら可）。補助標識「追越し禁止」があるときのみ追越し自体が禁止。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="追越し右側部分出通行禁止標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="10"/>
            <path d="M40 85 L40 42" stroke="#005bac" stroke-width="7" stroke-linecap="round"/>
            <polygon points="40,30 32,44 48,44" fill="#005bac"/>
            <path d="M74 84 C52 72, 52 50, 74 38" fill="none" stroke="#005bac" stroke-width="7" stroke-linecap="round"/>
            <polygon points="78,34 65,36 74,47" fill="#005bac"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="9" stroke-linecap="round"/>
        </svg>`
    },
    no_u_turn: {
        id: 'no_u_turn',
        name: '転回禁止',
        category: '規制標識',
        description: 'Uターン矢印に赤い斜線',
        keyRule: '転回（Uターン）が禁止される。右折や左折、後退は禁止されていない。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="転回禁止標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="10"/>
            <path d="M44 84 L44 50 A16 16 0 0 1 76 50 L76 74" fill="none" stroke="#005bac" stroke-width="8" stroke-linecap="round"/>
            <polygon points="76,86 67,71 85,71" fill="#005bac"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="9" stroke-linecap="round"/>
        </svg>`
    },
    no_crossing: {
        id: 'no_crossing',
        name: '車両横断禁止',
        category: '規制標識',
        description: '左向き矢印（直角の横切り）に赤い斜線',
        keyRule: '道路を横断（道路外の施設等へ入るための右折を含む）することが禁止される。交差点での右左折とは区別される。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="車両横断禁止標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="10"/>
            <path d="M84 82 L84 56 L42 56" fill="none" stroke="#005bac" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
            <polygon points="30,56 46,46 46,66" fill="#005bac"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="9" stroke-linecap="round"/>
        </svg>`
    },
    designated_dir_straight: {
        id: 'designated_dir_straight',
        name: '指定方向外進行禁止（直進のみ）',
        category: '規制標識',
        description: '青地の丸に白い上向き矢印1本',
        keyRule: '矢印の方向（この標識は直進のみ）以外の方向へ進行してはならない。ただし「一方通行（青の長方形）」と異なり、対向車や逆方向からの通行自体を示す標識ではない。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="指定方向外進行禁止直進のみ標識">
            <circle cx="60" cy="60" r="50" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <rect x="53" y="44" width="14" height="50" fill="#ffffff"/>
            <polygon points="60,22 38,50 82,50" fill="#ffffff"/>
        </svg>`
    },
    designated_dir_left: {
        id: 'designated_dir_left',
        name: '指定方向外進行禁止（左折のみ）',
        category: '規制標識',
        description: '青地の丸に白い左折矢印',
        keyRule: '交差点で矢印の方向（左折）以外へ進行してはならない。直進・右折・転回は禁止。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="指定方向外進行禁止左折のみ標識">
            <circle cx="60" cy="60" r="50" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <path d="M72 90 L72 52 L44 52" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
            <polygon points="24,52 48,36 48,68" fill="#ffffff"/>
        </svg>`
    },
    one_way: {
        id: 'one_way',
        name: '一方通行',
        category: '規制標識',
        description: '青地の長方形（または正方形に近い縦長）に白い矢印',
        keyRule: '矢印の方向にしか通行できない（逆走禁止）。なお、青丸の「指定方向外進行禁止」とは形が異なる。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="一方通行標識">
            <rect x="34" y="10" width="52" height="100" rx="5" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <rect x="53" y="45" width="14" height="48" fill="#ffffff"/>
            <polygon points="60,22 40,50 80,50" fill="#ffffff"/>
        </svg>`
    },
    pedestrians_only: {
        id: 'pedestrians_only',
        name: '歩行者専用',
        category: '規制標識',
        description: '青地の丸に白い親子（大人と子ども）の図柄',
        keyRule: '歩行者専用の道路（歩行者天国など）であり、自転車を含む車両の通行が禁止される。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="歩行者専用標識">
            <circle cx="60" cy="60" r="50" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <circle cx="50" cy="34" r="7" fill="#ffffff"/>
            <path d="M44 43 L56 43 L58 68 L53 68 L52 92 L46 92 L46 68 L41 92 L35 92 L42 62 Z" fill="#ffffff"/>
            <circle cx="75" cy="52" r="5.5" fill="#ffffff"/>
            <path d="M69 59 L80 59 L82 76 L78 76 L78 92 L73 92 L72 78 L68 92 L63 92 L68 72 Z" fill="#ffffff"/>
            <line x1="56" y1="50" x2="70" y2="62" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        </svg>`
    },
    bicycles_and_pedestrians: {
        id: 'bicycles_and_pedestrians',
        name: '自転車及び歩行者専用',
        category: '規制標識',
        description: '青地の丸に白い自転車と親子の図柄',
        keyRule: '普通自転車と歩行者が通行できる（特定小型原付も一定の要件で通行可能な場合あり）。自動車や一般原付は通行できない。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="自転車及び歩行者専用標識">
            <circle cx="60" cy="60" r="50" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <circle cx="38" cy="46" r="10" fill="none" stroke="#ffffff" stroke-width="3.5"/>
            <circle cx="66" cy="46" r="10" fill="none" stroke="#ffffff" stroke-width="3.5"/>
            <path d="M38 46 L49 32 L61 32 L66 46 M49 32 L52 46 L38 46" fill="none" stroke="#ffffff" stroke-width="3"/>
            <circle cx="48" cy="66" r="5" fill="#ffffff"/>
            <path d="M43 72 L53 72 L55 96 L43 96 Z" fill="#ffffff"/>
            <circle cx="72" cy="74" r="4" fill="#ffffff"/>
            <path d="M68 79 L76 79 L77 96 L67 96 Z" fill="#ffffff"/>
        </svg>`
    },
    no_pedestrians: {
        id: 'no_pedestrians',
        name: '歩行者通行止め',
        category: '規制標識',
        description: '白地の円に赤い枠と歩行者の図柄＋赤い斜線',
        keyRule: '歩行者の通行が禁止される。自動車などの車両は通行できる。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="歩行者通行止め標識">
            <circle cx="60" cy="60" r="46" fill="#ffffff" stroke="#d9232e" stroke-width="10"/>
            <circle cx="60" cy="36" r="6.5" fill="#005bac"/>
            <path d="M52 45 L68 45 L72 68 L66 68 L67 92 L60 92 L58 72 L53 92 L46 92 L52 65 Z" fill="#005bac"/>
            <line x1="27" y1="27" x2="93" y2="93" stroke="#d9232e" stroke-width="9" stroke-linecap="round"/>
        </svg>`
    },
    sound_horn: {
        id: 'sound_horn',
        name: '警笛鳴らせ',
        category: '規制標識',
        description: '青地の丸に白いラッパ（警音器）の図柄',
        keyRule: '見通しのきかない交差点・曲がり角・上り坂の頂上付近でこの標識がある場所では、必ず警音器を鳴らさなければならない（※「警笛区間」の補助標識と混同注意）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="警笛鳴らせ標識">
            <circle cx="60" cy="60" r="50" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <path d="M26 56 L66 56 L88 36 L88 84 L66 64 L26 64 Z" fill="#ffffff"/>
            <path d="M40 64 A10 10 0 0 0 58 64" fill="none" stroke="#ffffff" stroke-width="5"/>
        </svg>`
    },
    bus_priority_lane: {
        id: 'bus_priority_lane',
        name: '路線バス等優先通行帯',
        category: '規制標識',
        description: '青地の四角にバスの図柄と白文字「優先」・矢印',
        keyRule: '「優先通行帯」は普通車も通行できるが、路線バスが後方から近づいてきたら速やかに通行帯から出なければならず、混雑で出られなくなる場合は最初から進入できない（専用通行帯との違い）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="路線バス等優先通行帯標識">
            <rect x="14" y="14" width="92" height="92" rx="6" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <rect x="36" y="24" width="48" height="36" rx="5" fill="#ffffff"/>
            <rect x="41" y="29" width="38" height="16" rx="2" fill="#005bac"/>
            <circle cx="44" cy="53" r="3.5" fill="#005bac"/>
            <circle cx="76" cy="53" r="3.5" fill="#005bac"/>
            <text x="60" y="78" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="800" font-family="sans-serif">バス優先</text>
            <path d="M36 92 L84 92" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
            <polygon points="88,92 78,86 78,98" fill="#ffffff"/>
        </svg>`
    },

    // --- 指示標識 ---
    crosswalk: {
        id: 'crosswalk',
        name: '横断歩道',
        category: '指示標識',
        description: '青地の四角に白三角と歩く人・しま模様',
        keyRule: '横断歩道があることを示す指示標識。手前30m以内は追越し・追抜き禁止、側端から5m以内は駐停車禁止。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="横断歩道標識">
            <rect x="14" y="14" width="92" height="92" rx="6" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <polygon points="60,24 22,94 98,94" fill="#ffffff"/>
            <circle cx="62" cy="46" r="5.5" fill="#005bac"/>
            <path d="M56 54 L66 54 L70 72 L64 72 L66 86 L60 86 L58 72 L53 86 L47 86 L54 66 Z" fill="#005bac"/>
            <rect x="34" y="88" width="12" height="4" fill="#005bac"/>
            <rect x="54" y="88" width="12" height="4" fill="#005bac"/>
            <rect x="74" y="88" width="12" height="4" fill="#005bac"/>
        </svg>`
    },
    safety_zone: {
        id: 'safety_zone',
        name: '安全地帯',
        category: '指示標識',
        description: '青地の長方形に白いV字（島と両側進行方向）',
        keyRule: '安全地帯に歩行者がいるときは側方を通過する際に「徐行」しなければならない。歩行者がいないときは徐行義務はない（※路面電車停車中を除く）。安全地帯の左側と前後10m以内は駐停車禁止。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="安全地帯標識">
            <rect x="18" y="26" width="84" height="68" rx="5" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <path d="M30 82 L44 38 L52 38 L38 82 Z" fill="#ffffff"/>
            <path d="M90 82 L76 38 L68 38 L82 82 Z" fill="#ffffff"/>
            <rect x="52" y="42" width="16" height="40" rx="8" fill="#ffffff"/>
        </svg>`
    },
    priority_road: {
        id: 'priority_road',
        name: '優先道路',
        category: '指示標識',
        description: '青縁・白枠の中に黄色のひし形',
        keyRule: '交差点において他方の道路より優先する道路。優先道路を通行しているときは交差点とその手前30m以内でも「追越し」が可能（他要件に反しない限り）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="優先道路標識">
            <rect x="16" y="16" width="88" height="88" rx="4" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <polygon points="60,24 96,60 60,96 24,60" fill="#ffffff"/>
            <polygon points="60,34 86,60 60,86 34,60" fill="#f5c400"/>
        </svg>`
    },
    parking_allowed: {
        id: 'parking_allowed',
        name: '駐車可',
        category: '指示標識',
        description: '青地の四角に白い大きな「P」',
        keyRule: '駐車できることを示す指示標識。ただし「無余地場所」や「車庫出入口3m以内」など他の禁止規定に反する停め方は不可。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="駐車可標識">
            <rect x="14" y="14" width="92" height="92" rx="6" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <text x="60" y="84" text-anchor="middle" fill="#ffffff" font-size="68" font-weight="800" font-family="sans-serif">P</text>
        </svg>`
    },
    stop_line: {
        id: 'stop_line',
        name: '停止線',
        category: '指示標識',
        description: '青地の四角に白い水平線と手前の車・矢印',
        keyRule: '車両が停止しなければならない位置を示す指示標識。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="停止線標識">
            <rect x="16" y="16" width="88" height="88" rx="6" fill="#005bac" stroke="#ffffff" stroke-width="3"/>
            <rect x="26" y="34" width="68" height="10" fill="#ffffff"/>
            <rect x="46" y="56" width="28" height="32" rx="5" fill="#ffffff"/>
            <polygon points="60,46 50,56 70,56" fill="#ffffff"/>
        </svg>`
    },

    // --- 警戒標識 ---
    warn_intersection: {
        id: 'warn_intersection',
        name: '＋形道路交差点あり',
        category: '警戒標識',
        description: '黄色のひし形に黒枠と十字（＋）の図柄',
        keyRule: '先に十字路交差点があることを警戒させる標識。ただし「徐行義務」の標識ではない（見通しがきく場合は徐行義務なし）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="十字路交差点あり標識">
            <polygon points="60,10 110,60 60,110 10,60" fill="#f5c400" stroke="#111827" stroke-width="5" stroke-linejoin="round"/>
            <rect x="54" y="32" width="12" height="56" fill="#111827"/>
            <rect x="32" y="54" width="56" height="12" fill="#111827"/>
        </svg>`
    },
    warn_railroad: {
        id: 'warn_railroad',
        name: '踏切あり',
        category: '警戒標識',
        description: '黄色のひし形に電車（または蒸気機関車）の図柄',
        keyRule: '前方に踏切があることを示す警戒標識。踏切を通過するときは直前で必ず一時停止し、安全を確かめなければならない（信号機がある場合を除く）。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="踏切あり標識">
            <polygon points="60,10 110,60 60,110 10,60" fill="#f5c400" stroke="#111827" stroke-width="5" stroke-linejoin="round"/>
            <rect x="44" y="34" width="32" height="38" rx="4" fill="#111827"/>
            <rect x="49" y="40" width="22" height="14" fill="#f5c400"/>
            <circle cx="51" cy="63" r="3" fill="#f5c400"/>
            <circle cx="69" cy="63" r="3" fill="#f5c400"/>
            <line x1="42" y1="78" x2="78" y2="78" stroke="#111827" stroke-width="4"/>
            <line x1="46" y1="72" x2="38" y2="86" stroke="#111827" stroke-width="4"/>
            <line x1="74" y1="72" x2="82" y2="86" stroke="#111827" stroke-width="4"/>
        </svg>`
    },
    warn_school: {
        id: 'warn_school',
        name: '学校、幼稚園、保育所等あり',
        category: '警戒標識',
        description: '黄色のひし形に小学生（ランドセルの児童）の図柄',
        keyRule: '付近に学校や幼稚園などがあり、子どもの飛び出しに注意すべきことを示す警戒標識。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="学校等あり標識">
            <polygon points="60,10 110,60 60,110 10,60" fill="#f5c400" stroke="#111827" stroke-width="5" stroke-linejoin="round"/>
            <circle cx="48" cy="39" r="5.5" fill="#111827"/>
            <path d="M42 46 L54 46 L57 65 L52 65 L53 84 L48 84 L46 66 L41 84 L36 84 L41 62 Z" fill="#111827"/>
            <circle cx="71" cy="46" r="5" fill="#111827"/>
            <path d="M66 53 L76 53 L78 68 L74 68 L74 84 L70 84 L69 70 L65 84 L61 84 L65 65 Z" fill="#111827"/>
        </svg>`
    },
    warn_slippery: {
        id: 'warn_slippery',
        name: 'すべりやすい',
        category: '警戒標識',
        description: '黄色のひし形に車がスリップする波線の図柄',
        keyRule: '雨・雪・凍結などで路面がすべりやすい場所であることを示す。急ブレーキ・急ハンドルを避け速度を落として走行する。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="すべりやすい標識">
            <polygon points="60,10 110,60 60,110 10,60" fill="#f5c400" stroke="#111827" stroke-width="5" stroke-linejoin="round"/>
            <rect x="46" y="34" width="28" height="22" rx="4" fill="#111827"/>
            <path d="M48 62 C38 70, 56 76, 44 86" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/>
            <path d="M72 62 C62 70, 80 76, 68 86" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/>
        </svg>`
    },
    warn_narrow: {
        id: 'warn_narrow',
        name: '幅員減少',
        category: '警戒標識',
        description: '黄色のひし形に先が狭くなる2本の線',
        keyRule: 'この先、道路の幅が狭くなることを示す警戒標識。あらかじめ速度を落とし対向車とのすれ違いに備える。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="幅員減少標識">
            <polygon points="60,10 110,60 60,110 10,60" fill="#f5c400" stroke="#111827" stroke-width="5" stroke-linejoin="round"/>
            <path d="M40 84 L40 60 L50 48 L50 32" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M80 84 L80 60 L70 48 L70 32" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    warn_signal: {
        id: 'warn_signal',
        name: '信号機あり',
        category: '警戒標識',
        description: '黄色のひし形に縦型信号機（赤・黄・青）の図柄',
        keyRule: '見通しの悪いカーブの先などに信号機があることを予告する警戒標識。',
        svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="信号機あり標識">
            <polygon points="60,10 110,60 60,110 10,60" fill="#f5c400" stroke="#111827" stroke-width="5" stroke-linejoin="round"/>
            <rect x="49" y="30" width="22" height="60" rx="6" fill="#111827"/>
            <circle cx="60" cy="42" r="6" fill="#ef4444"/>
            <circle cx="60" cy="60" r="6" fill="#f5c400"/>
            <circle cx="60" cy="78" r="6" fill="#10b981"/>
        </svg>`
    },

    // --- 道路標示 ---
    marking_diamond: {
        id: 'marking_diamond',
        name: '道路標示：横断歩道又は自転車横断帯あり（ひし形◇）',
        category: '道路標示',
        description: '路面（アスファルト）に描かれた白いひし形（ダイヤマーク）',
        keyRule: 'この先に横断歩道または自転車横断帯があることを予告する指示標示（一般的に30m・50m手前に2つ描かれる）。安全確認し減速する。',
        svg: `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ひし形道路標示">
            <rect x="10" y="8" width="140" height="94" rx="8" fill="#334155"/>
            <line x1="25" y1="8" x2="25" y2="102" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="8 6"/>
            <line x1="135" y1="8" x2="135" y2="102" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="8 6"/>
            <polygon points="80,20 105,55 80,90 55,55" fill="none" stroke="#ffffff" stroke-width="7"/>
        </svg>`
    },
    marking_yellow_center: {
        id: 'marking_yellow_center',
        name: '道路標示：追越しのための右側部分はみ出し通行禁止（黄色実線中央線）',
        category: '道路標示',
        description: '路面中央に引かれた黄色の実線',
        keyRule: '追越しのために道路の中央から右側部分にはみ出して通行してはならない。ただし道路工事等で障害物を避けるためや右折のためにやむを得ずまたぐこと自体は禁止されていない（※車線境界線の黄色実線「進路変更禁止」とは意味が異なる）。',
        svg: `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="黄色実線中央線標示">
            <rect x="10" y="8" width="140" height="94" rx="8" fill="#334155"/>
            <line x1="80" y1="12" x2="80" y2="98" stroke="#f59e0b" stroke-width="7"/>
            <rect x="94" y="55" width="22" height="34" rx="4" fill="#60a5fa"/>
            <polygon points="105,40 97,52 113,52" fill="#ffffff"/>
        </svg>`
    },
    marking_no_stopping_zone: {
        id: 'marking_no_stopping_zone',
        name: '道路標示：停止禁止部分',
        category: '道路標示',
        description: '白い四角い枠の中に白い斜線（ゼブラ模様）',
        keyRule: '消防署や警察署の出入口前などに設けられ、前方の渋滞等によりこの枠内で停止するおそれがあるときは進入してはならない。',
        svg: `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="停止禁止部分標示">
            <rect x="10" y="8" width="140" height="94" rx="8" fill="#334155"/>
            <rect x="34" y="22" width="92" height="66" fill="none" stroke="#ffffff" stroke-width="4"/>
            <line x1="34" y1="54" x2="66" y2="22" stroke="#ffffff" stroke-width="4"/>
            <line x1="34" y1="88" x2="100" y2="22" stroke="#ffffff" stroke-width="4"/>
            <line x1="66" y1="88" x2="126" y2="28" stroke="#ffffff" stroke-width="4"/>
            <line x1="98" y1="88" x2="126" y2="60" stroke="#ffffff" stroke-width="4"/>
        </svg>`
    },
    marking_yellow_curb: {
        id: 'marking_yellow_curb',
        name: '道路標示：駐停車禁止（黄色の実線の縁石）',
        category: '道路標示',
        description: '歩道の縁石側面等に塗られた黄色の実線',
        keyRule: '歩道の縁石等に「黄色の実線」が引かれている場所は駐停車禁止、「黄色の破線（点線）」が引かれている場所は駐車禁止を表す。',
        svg: `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="黄色実線縁石標示">
            <rect x="10" y="8" width="140" height="94" rx="8" fill="#334155"/>
            <rect x="10" y="72" width="140" height="30" fill="#94a3b8"/>
            <rect x="10" y="64" width="140" height="10" fill="#f59e0b"/>
            <text x="80" y="92" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="700" font-family="sans-serif">歩道（縁石・黄色の実線）</text>
        </svg>`
    }
};

window.HAZARD_SCENES = {
    hazard_right_turn_blindspot: {
        id: 'hazard_right_turn_blindspot',
        title: '交差点右折時（対向大型車の死角）',
        speed: '時速15kmで右折待ちから発進',
        situation: '青信号の交差点で右折しようとしている。対向車線には右折待ちの大型トラックが停止しており、その陰（左後方）の視界が遮られている。右折先の横断歩道付近には歩行者がいる。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="交差点右折時の危険予測">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="165" y="0" width="150" height="270" fill="#475569"/>
            <rect x="0" y="85" width="480" height="105" fill="#475569"/>
            <line x1="240" y1="0" x2="240" y2="85" stroke="#f59e0b" stroke-width="3"/>
            <line x1="240" y1="190" x2="240" y2="270" stroke="#f59e0b" stroke-width="3"/>
            <!-- 横断歩道（右折先） -->
            <g fill="#e2e8f0">
                <rect x="322" y="94" width="16" height="8"/><rect x="322" y="109" width="16" height="8"/>
                <rect x="322" y="124" width="16" height="8"/><rect x="322" y="139" width="16" height="8"/>
                <rect x="322" y="154" width="16" height="8"/><rect x="322" y="169" width="16" height="8"/>
            </g>
            <!-- 死角ゾーン -->
            <polygon points="248,185 268,20 315,20 315,185" fill="rgba(239,68,68,0.22)" stroke="#ef4444" stroke-dasharray="5 4" stroke-width="1.5"/>
            <text x="290" y="42" text-anchor="middle" fill="#fca5a5" font-size="11" font-weight="700">死角</text>
            <!-- 対向大型トラック -->
            <rect x="248" y="80" width="32" height="58" rx="4" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
            <rect x="250" y="120" width="28" height="15" rx="2" fill="#64748b"/>
            <text x="264" y="105" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">大型車</text>
            <!-- 直進バイク（陰から） -->
            <rect x="288" y="54" width="14" height="26" rx="4" fill="#f97316" stroke="#fff" stroke-width="1.5"/>
            <path d="M295 82 L295 148" stroke="#f97316" stroke-width="3" stroke-dasharray="4 3"/>
            <polygon points="295,155 289,144 301,144" fill="#f97316"/>
            <text x="303" y="70" fill="#fdba74" font-size="10" font-weight="700">直進二輪</text>
            <!-- 自車（青） -->
            <rect x="210" y="162" width="26" height="44" rx="5" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <text x="223" y="188" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800">自車</text>
            <path d="M223 160 Q225 135 305 135" fill="none" stroke="#60a5fa" stroke-width="3.5" stroke-dasharray="6 3"/>
            <polygon points="313,135 302,129 302,141" fill="#60a5fa"/>
            <!-- 歩行者 -->
            <circle cx="348" cy="166" r="7" fill="#fde047" stroke="#0f172a" stroke-width="1.5"/>
            <text x="364" y="170" fill="#fde047" font-size="10" font-weight="700">歩行者</text>
            <!-- 信号・情報バッジ -->
            <rect x="12" y="12" width="142" height="50" rx="8" fill="rgba(15,23,42,0.88)" stroke="#475569"/>
            <circle cx="30" cy="30" r="7" fill="#10b981"/>
            <text x="44" y="34" fill="#f8fafc" font-size="11" font-weight="700">対面信号：青</text>
            <text x="22" y="52" fill="#93c5fd" font-size="11" font-weight="700">速度：15km/h 右折</text>
        </svg>`
    },
    hazard_bus_stop_pedestrian: {
        id: 'hazard_bus_stop_pedestrian',
        title: '停留所停車中の路線バスの側方通過',
        speed: '時速35kmで走行中',
        situation: '片側1車線の道路で、停留所に路線バスが客の乗降のため停車している。自車はバスの右側を通過しようとしている。バスの前方は死角になっており、後方には後続車が走っている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="停車中バスの側方通過">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="0" y="55" width="480" height="160" fill="#475569"/>
            <rect x="0" y="32" width="480" height="23" fill="#64748b"/>
            <rect x="0" y="215" width="480" height="23" fill="#64748b"/>
            <line x1="0" y1="135" x2="480" y2="135" stroke="#ffffff" stroke-width="3" stroke-dasharray="14 10"/>
            <!-- バス停＆停車中バス -->
            <rect x="180" y="164" width="118" height="44" rx="6" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
            <text x="239" y="191" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="800">路線バス（停車中）</text>
            <!-- 死角＆横断歩行者 -->
            <polygon points="298,210 355,140 355,210" fill="rgba(239,68,68,0.25)" stroke="#ef4444" stroke-dasharray="4 3"/>
            <circle cx="312" cy="198" r="8" fill="#fde047" stroke="#0f172a" stroke-width="1.5"/>
            <path d="M312 190 L312 150" stroke="#fde047" stroke-width="2.5" stroke-dasharray="3 3"/>
            <polygon points="312,143 307,153 317,153" fill="#fde047"/>
            <text x="326" y="164" fill="#fde047" font-size="10" font-weight="700">バス前方の死角</text>
            <!-- 対向車 -->
            <rect x="340" y="72" width="60" height="34" rx="5" fill="#94a3b8" stroke="#fff" stroke-width="1.5"/>
            <path d="M335 89 L280 89" stroke="#e2e8f0" stroke-width="2.5"/>
            <polygon points="274,89 284,84 284,94" fill="#e2e8f0"/>
            <text x="370" y="93" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">対向車</text>
            <!-- 自車 -->
            <rect x="92" y="164" width="58" height="34" rx="5" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <text x="121" y="185" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800">自車</text>
            <path d="M150 180 Q180 154 240 148" fill="none" stroke="#60a5fa" stroke-width="3" stroke-dasharray="5 3"/>
            <!-- 情報バッジ -->
            <rect x="12" y="12" width="165" height="36" rx="8" fill="rgba(15,23,42,0.88)" stroke="#475569"/>
            <text x="22" y="34" fill="#93c5fd" font-size="11" font-weight="700">速度：35km/h バス側方</text>
        </svg>`
    },
    hazard_residential_child: {
        id: 'hazard_residential_child',
        title: '住宅街の狭い道路（ボールと子ども・駐車車両）',
        speed: '時速30kmで直進中',
        situation: '見通しの悪い住宅街の生活道路を直進中。左側には駐車車両があり、その先からボールが道路に転がり出てきた。右側には見通しの悪いT字路がある。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="住宅街での危険予測">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="155" y="0" width="170" height="270" fill="#475569"/>
            <rect x="325" y="70" width="155" height="75" fill="#475569"/>
            <!-- ブロック塀 -->
            <rect x="328" y="148" width="12" height="90" fill="#94a3b8"/>
            <text x="346" y="190" fill="#cbd5e1" font-size="10">見通し悪い塀</text>
            <!-- 駐車車両 -->
            <rect x="164" y="95" width="32" height="58" rx="4" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
            <text x="180" y="128" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">駐車車</text>
            <!-- ボールと飛び出し児童 -->
            <circle cx="215" cy="78" r="7" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
            <path d="M168 85 L210 79" stroke="#fca5a5" stroke-width="2" stroke-dasharray="3 2"/>
            <circle cx="145" cy="84" r="8" fill="#fde047"/>
            <text x="95" y="88" fill="#fde047" font-size="10" font-weight="700">子ども？</text>
            <!-- 自車 -->
            <rect x="222" y="182" width="32" height="56" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="238" y="214" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <path d="M238 180 L238 110" stroke="#60a5fa" stroke-width="3" stroke-dasharray="5 3"/>
            <polygon points="238,100 231,112 245,112" fill="#60a5fa"/>
            <!-- 情報バッジ -->
            <rect x="12" y="12" width="142" height="44" rx="8" fill="rgba(15,23,42,0.88)" stroke="#475569"/>
            <text x="22" y="30" fill="#93c5fd" font-size="11" font-weight="700">住宅街・生活道路</text>
            <text x="22" y="47" fill="#fde047" font-size="11" font-weight="700">速度：30km/h</text>
        </svg>`
    },
    hazard_rain_night_intersection: {
        id: 'hazard_rain_night_intersection',
        title: '雨天・夜間の幹線道路（蒸発現象・黒服の歩行者）',
        speed: '時速50kmで走行中',
        situation: '雨が強く降る夜間の幹線道路。対向車のヘッドライトが濡れた路面に反射してまぶしく、中央線付近が見えにくい（蒸発現象）。前方には横断歩道がある。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="雨天夜間の危険予測">
            <rect width="480" height="270" fill="#090d16"/>
            <rect x="0" y="65" width="480" height="150" fill="#1e293b"/>
            <line x1="0" y1="140" x2="480" y2="140" stroke="#94a3b8" stroke-width="2" stroke-dasharray="10 10"/>
            <!-- 雨線 -->
            <g stroke="#64748b" stroke-width="1.2" opacity="0.7">
                <line x1="40" y1="10" x2="30" y2="35"/><line x1="120" y1="20" x2="110" y2="45"/>
                <line x1="220" y1="15" x2="210" y2="40"/><line x1="340" y1="25" x2="330" y2="50"/>
                <line x1="420" y1="12" x2="410" y2="37"/>
            </g>
            <!-- 対向車ヘッドライト -->
            <rect x="355" y="88" width="58" height="32" rx="5" fill="#94a3b8"/>
            <polygon points="355,95 215,68 215,135 355,112" fill="rgba(254,240,138,0.28)"/>
            <text x="384" y="108" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">対向車</text>
            <!-- 蒸発現象の歩行者（暗い） -->
            <circle cx="245" cy="142" r="8" fill="#334155" stroke="#ef4444" stroke-width="2" stroke-dasharray="3 2"/>
            <text x="245" y="164" text-anchor="middle" fill="#fca5a5" font-size="10" font-weight="700">黒服の歩行者（見えにくい）</text>
            <!-- 自車とライト -->
            <rect x="75" y="162" width="60" height="34" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <polygon points="135,165 245,148 245,208 135,192" fill="rgba(147,197,253,0.25)"/>
            <text x="105" y="183" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <!-- 情報バッジ -->
            <rect x="12" y="12" width="165" height="44" rx="8" fill="rgba(15,23,42,0.9)" stroke="#475569"/>
            <text x="22" y="30" fill="#93c5fd" font-size="11" font-weight="700">天候：雨天・夜間</text>
            <text x="22" y="47" fill="#fde047" font-size="11" font-weight="700">速度：50km/h</text>
        </svg>`
    },
    hazard_left_turn_bike: {
        id: 'hazard_left_turn_bike',
        title: '交差点左折時（左後方の自転車巻き込み）',
        speed: '時速15kmで左折しようとしている',
        situation: '青信号の交差点を左折しようとしている。左側方後方には、直進してきそうな自転車（または原付）が走っている。左折先の横断歩道には歩行者が近づいている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="交差点左折時の巻き込み危険予測">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="165" y="0" width="150" height="270" fill="#475569"/>
            <rect x="0" y="85" width="480" height="105" fill="#475569"/>
            <!-- 左折先の横断歩道 -->
            <g fill="#e2e8f0">
                <rect x="140" y="96" width="16" height="8"/><rect x="140" y="112" width="16" height="8"/>
                <rect x="140" y="128" width="16" height="8"/><rect x="140" y="144" width="16" height="8"/>
                <rect x="140" y="160" width="16" height="8"/>
            </g>
            <!-- 自転車 -->
            <rect x="278" y="210" width="12" height="26" rx="4" fill="#10b981" stroke="#fff" stroke-width="1.5"/>
            <path d="M284 208 L284 148" stroke="#10b981" stroke-width="2.5" stroke-dasharray="4 3"/>
            <polygon points="284,140 278,150 290,150" fill="#10b981"/>
            <text x="302" y="226" fill="#6ee7b7" font-size="10" font-weight="700">直進自転車</text>
            <!-- 自車（左折） -->
            <rect x="246" y="176" width="26" height="44" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="259" y="202" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <path d="M259 175 Q255 152 175 152" fill="none" stroke="#60a5fa" stroke-width="3.5" stroke-dasharray="5 3"/>
            <polygon points="165,152 176,146 176,158" fill="#60a5fa"/>
            <!-- 歩行者 -->
            <circle cx="148" cy="180" r="7" fill="#fde047"/>
            <text x="90" y="185" fill="#fde047" font-size="10" font-weight="700">歩行者</text>
            <!-- 情報バッジ -->
            <rect x="12" y="12" width="142" height="44" rx="8" fill="rgba(15,23,42,0.88)" stroke="#475569"/>
            <text x="22" y="30" fill="#10b981" font-size="11" font-weight="700">対面信号：青</text>
            <text x="22" y="47" fill="#93c5fd" font-size="11" font-weight="700">速度：15km/h 左折</text>
        </svg>`
    },
    hazard_highway_merge: {
        id: 'hazard_highway_merge',
        title: '高速道路の加速車線からの合流と本線走行',
        speed: '自車は加速車線（時速70km）で合流直前',
        situation: '高速道路の加速車線を走行し、本線車道（時速100km制限）へ合流しようとしている。本線右側からは後続車が接近しており、前方は合流の終端に近づいている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="高速道路合流の危険予測">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="0" y="65" width="480" height="90" fill="#475569"/>
            <polygon points="0,155 340,155 390,110 0,110" fill="#475569"/>
            <rect x="0" y="155" width="335" height="45" fill="#475569"/>
            <line x1="0" y1="110" x2="480" y2="110" stroke="#ffffff" stroke-width="2" stroke-dasharray="14 10"/>
            <line x1="0" y1="155" x2="310" y2="155" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 8"/>
            <text x="65" y="185" fill="#cbd5e1" font-size="11" font-weight="700">加速車線</text>
            <text x="240" y="84" fill="#cbd5e1" font-size="11" font-weight="700">本線車道（追越車線 / 走行車線）</text>
            <!-- 本線接近車 -->
            <rect x="75" y="118" width="58" height="30" rx="5" fill="#f97316" stroke="#fff" stroke-width="1.5"/>
            <path d="M136 133 L210 133" stroke="#f97316" stroke-width="3"/>
            <polygon points="218,133 207,127 207,139" fill="#f97316"/>
            <text x="104" y="137" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">本線車</text>
            <!-- 自車 -->
            <rect x="175" y="163" width="56" height="30" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="203" y="182" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <path d="M232 176 Q275 168 305 136" fill="none" stroke="#60a5fa" stroke-width="3" stroke-dasharray="5 3"/>
            <polygon points="312,130 300,134 308,143" fill="#60a5fa"/>
            <!-- 情報バッジ -->
            <rect x="12" y="12" width="185" height="44" rx="8" fill="rgba(15,23,42,0.88)" stroke="#475569"/>
            <text x="22" y="30" fill="#93c5fd" font-size="11" font-weight="700">高速自動車国道（合流）</text>
            <text x="22" y="47" fill="#fde047" font-size="11" font-weight="700">自車速度：70km/h</text>
        </svg>`
    },
    hazard_school_zone_parked: {
        id: 'hazard_school_zone_parked',
        title: '通学路・連続駐車車両の横を通過',
        speed: '時速30kmで直進中',
        situation: '学校の近くの道路を直進中。左側には車が連続して駐車しており、乗用車の運転席ドアが少し開きかけているようにも見える。前方の対向車線からは対向車が近づいている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="通学路駐車車両の危険予測">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="145" y="0" width="190" height="270" fill="#475569"/>
            <!-- 駐車車両2台 -->
            <rect x="155" y="42" width="32" height="58" rx="4" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
            <rect x="155" y="120" width="32" height="58" rx="4" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
            <!-- 開きかけドア -->
            <line x1="187" y1="138" x2="202" y2="152" stroke="#ef4444" stroke-width="4"/>
            <text x="206" y="148" fill="#fca5a5" font-size="10" font-weight="700">ドア注意</text>
            <!-- 車の間から児童 -->
            <circle cx="170" cy="110" r="7" fill="#fde047"/>
            <text x="86" y="114" fill="#fde047" font-size="10" font-weight="700">児童の陰</text>
            <!-- 対向車 -->
            <rect x="288" y="38" width="32" height="58" rx="4" fill="#94a3b8" stroke="#fff" stroke-width="1.5"/>
            <path d="M304 98 L304 148" stroke="#e2e8f0" stroke-width="2.5"/>
            <polygon points="304,155 298,144 310,144" fill="#e2e8f0"/>
            <!-- 自車 -->
            <rect x="218" y="192" width="32" height="54" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="234" y="223" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <rect x="12" y="12" width="126" height="44" rx="8" fill="rgba(15,23,42,0.88)" stroke="#475569"/>
            <text x="22" y="30" fill="#fde047" font-size="11" font-weight="700">通学路（登下校）</text>
            <text x="22" y="47" fill="#93c5fd" font-size="11" font-weight="700">速度：30km/h</text>
        </svg>`
    },
    hazard_mountain_curve: {
        id: 'hazard_mountain_curve',
        title: '見通しの悪い山道カーブと長い下り坂',
        speed: '時速40kmでカーブへ進入',
        situation: '見通しの悪い左カーブが続く長い下り坂（山道）を走行中。カーブの先は崖と樹木で死角になっており、路面端には濡れた落ち葉が積もっている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="見通しの悪いカーブと下り坂">
            <rect width="480" height="270" fill="#14532d"/>
            <path d="M180 270 Q185 150 320 65 L395 65 L395 145 Q275 185 275 270 Z" fill="#475569"/>
            <path d="M227 270 Q230 168 358 105" fill="none" stroke="#f59e0b" stroke-width="3"/>
            <!-- カーブミラー -->
            <circle cx="310" cy="48" r="14" fill="#e2e8f0" stroke="#f97316" stroke-width="3"/>
            <text x="330" y="52" fill="#fed7aa" font-size="10" font-weight="700">カーブミラー</text>
            <!-- 対向車のはみ出し警戒 -->
            <rect x="338" y="88" width="42" height="24" rx="4" fill="#ef4444" opacity="0.8"/>
            <text x="392" y="104" fill="#fca5a5" font-size="10" font-weight="700">対向車？</text>
            <!-- 自車 -->
            <rect x="236" y="196" width="28" height="48" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="250" y="224" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <rect x="12" y="12" width="165" height="44" rx="8" fill="rgba(15,23,42,0.9)" stroke="#475569"/>
            <text x="22" y="30" fill="#93c5fd" font-size="11" font-weight="700">長い下り坂・左カーブ</text>
            <text x="22" y="47" fill="#fde047" font-size="11" font-weight="700">速度：40km/h</text>
        </svg>`
    },
    hazard_railroad_crossing: {
        id: 'hazard_railroad_crossing',
        title: '踏切の通過と踏切先の渋滞',
        speed: '踏切の直前で一時停止中',
        situation: '踏切の直前で一時停止した。踏切内の道路幅は狭く、踏切を渡った先の道路では前方車両が渋滞して止まっている。対向車線からも車が近づいている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="踏切通過の危険予測">
            <rect width="480" height="270" fill="#1e293b"/>
            <rect x="170" y="0" width="140" height="270" fill="#475569"/>
            <!-- 線路 -->
            <rect x="0" y="105" width="480" height="46" fill="#78350f"/>
            <line x1="0" y1="115" x2="480" y2="115" stroke="#cbd5e1" stroke-width="4"/>
            <line x1="0" y1="141" x2="480" y2="141" stroke="#cbd5e1" stroke-width="4"/>
            <!-- 停止線 -->
            <line x1="240" y1="176" x2="306" y2="176" stroke="#ffffff" stroke-width="5"/>
            <!-- 踏切先の渋滞車 -->
            <rect x="250" y="44" width="32" height="52" rx="4" fill="#f97316" stroke="#fff" stroke-width="1.5"/>
            <text x="266" y="74" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">渋滞停止</text>
            <!-- 自車 -->
            <rect x="250" y="184" width="32" height="54" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="266" y="215" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <rect x="12" y="12" width="160" height="44" rx="8" fill="rgba(15,23,42,0.9)" stroke="#475569"/>
            <text x="22" y="30" fill="#93c5fd" font-size="11" font-weight="700">踏切直前（一時停止）</text>
            <text x="22" y="47" fill="#fca5a5" font-size="11" font-weight="700">先が渋滞中</text>
        </svg>`
    },
    hazard_evening_dusk: {
        id: 'hazard_evening_dusk',
        title: '夕暮れ時（薄暮）の郊外道路',
        speed: '時速45kmで走行中（ライト未点灯）',
        situation: '日没直後の薄暗い夕暮れ時（薄暮）。街灯は少なく、前方には右折待ちの対向車が止まっている。左端には反射材のない無灯火の自転車が走っている。',
        svg: `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="夕暮れ時の危険予測">
            <rect width="480" height="270" fill="#1e1b4b"/>
            <rect x="0" y="75" width="480" height="140" fill="#334155"/>
            <line x1="0" y1="145" x2="480" y2="145" stroke="#f59e0b" stroke-width="2.5"/>
            <!-- 夕暮れの太陽名残 -->
            <circle cx="420" cy="40" r="24" fill="#f97316" opacity="0.35"/>
            <!-- 無灯火自転車 -->
            <rect x="275" y="192" width="26" height="10" rx="3" fill="#64748b" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 2"/>
            <text x="288" y="184" text-anchor="middle" fill="#fca5a5" font-size="10" font-weight="700">無灯火自転車</text>
            <!-- 対向右折待ち車 -->
            <rect x="330" y="102" width="56" height="30" rx="4" fill="#94a3b8"/>
            <circle cx="333" cy="128" r="4" fill="#f59e0b"/>
            <text x="358" y="121" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700">右折待ち</text>
            <!-- 自車 -->
            <rect x="85" y="164" width="58" height="32" rx="5" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
            <text x="114" y="184" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">自車</text>
            <rect x="12" y="12" width="165" height="44" rx="8" fill="rgba(15,23,42,0.9)" stroke="#475569"/>
            <text x="22" y="30" fill="#fdba74" font-size="11" font-weight="700">時間帯：薄暮（夕暮れ）</text>
            <text x="22" y="47" fill="#93c5fd" font-size="11" font-weight="700">速度：45km/h</text>
        </svg>`
    }
};

window.renderQuizVisualHTML = function (quiz, options = {}) {
    if (!quiz || !quiz.visual_type || !quiz.visual_id) return '';
    const { revealAnswer = false } = options;

    if (quiz.visual_type === 'sign') {
        const sign = window.ROAD_SIGNS && window.ROAD_SIGNS[quiz.visual_id];
        if (!sign) return '';
        const caption = revealAnswer
            ? `<div class="visual-caption revealed">📌 正式名称：<strong>${sign.name}</strong>（${sign.category}）</div>`
            : `<div class="visual-caption">🚦 道路標識・道路標示（図を見て正誤を判定してください）</div>`;
        return `
            <div class="sign-visual-card">
                <div class="sign-svg-frame">${sign.svg}</div>
                ${caption}
            </div>
        `;
    }

    if (quiz.visual_type === 'hazard') {
        const scene = window.HAZARD_SCENES && window.HAZARD_SCENES[quiz.visual_id];
        if (!scene) return '';
        return `
            <div class="hazard-visual-card">
                <div class="hazard-visual-header">
                    <span class="hazard-scene-title">🚗 ${scene.title}</span>
                    <span class="hazard-scene-speed">⏱ ${scene.speed}</span>
                </div>
                <div class="hazard-svg-frame">${scene.svg}</div>
                <div class="hazard-situation-note">${scene.situation}</div>
            </div>
        `;
    }

    return '';
};
