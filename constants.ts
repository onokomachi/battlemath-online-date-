
import type { Problem, ProblemCard, Category, Ability, AbilityType } from './types';
import { geometryProblems } from './data/geometryProblems';
import { linearFunctionsProblems } from './data/linearFunctionsProblems';
import { polynomialProblems } from './data/polynomialProblems';
import { probabilityProblems } from './data/probabilityProblems';
import { simultaneousEquationsProblems } from './data/simultaneousEquations';

export const MAX_SCORE = 5;
export const DECK_SIZE = 20;
export const HAND_SIZE = 5;
export const MAX_DUPLICATES = 2;

// HP Battle System (aicardbattle2 integration)
// エビデンスレベルA: Firebase Auth公式パターン + HP制カードバトル標準設計
export const INITIAL_HP = 20;

// Damage formula: difficulty × 2 HP
// Difficulty 1 = 2dmg, 2 = 4dmg, 3 = 6dmg, 4 = 8dmg, 5 = 10dmg
export const calcDamage = (difficulty: number): number => difficulty * 2;

// Admin settings
export const ADMIN_EMAILS: string[] = []; // Add admin email addresses here
export const GAMEMASTER_PASSWORD = '215124'; // Change in production

export const DECK_CONSTRAINTS: Record<number, number> = {
  4: 7,
  5: 3,
};

// 要望に基づき、細かい単元を維持しつつ、学習目的別にグループ化して構造化
export const MATH_CATEGORIES: Category[] = [
    {
        name: "式の計算",
        groups: [
            {
                name: "基本と次数",
                subtopics: ["式の次数", "同類項の加減(基)", "数値代入(基)"]
            },
            {
                name: "加法・減法",
                subtopics: ["同類項の加減(標1)", "同類項の加減(標2)", "(#+#)+(#+#)", "(#+#)-(#+#)", "(#+#)±#(#+#)", "縦書きの加法", "減法"]
            },
            {
                name: "乗法・除法",
                subtopics: ["式の乗法(基)", "式の乗法(標)", "式の二乗(基)", "式の三乗(基)", "式の除法(初1)", "式の除法(基1)", "式の除法(基2)", "式の除法(標1)", "式の除法(標2)"]
            },
            {
                name: "分数・混合計算",
                subtopics: ["分数式の加減(基礎)", "分数式の加減(標準1)", "分数式の加減(標準2)", "乗除の混合型1", "乗除の混合型2", "乗除の混合型3"]
            },
            {
                name: "応用とまとめ",
                subtopics: ["数値代入(標1)", "数値代入(標2)", "等式の変形(基)", "等式の変形(標1)", "等式の変形(標2)", "式の変形(完)", "文字式(完成1)", "文字式(完成2)", "文字式の値(完)"]
            }
        ]
    },
    {
        name: "連立方程式",
        groups: [
            {
                name: "計算の基本",
                subtopics: ["加減法（ガイド付き）", "代入法（ガイド付き）", "加減法（計算練習）①", "代入法（計算練習）①"]
            },
            {
                name: "複雑な計算",
                subtopics: ["加減法（計算練習）②", "代入法（計算練習）②", "()付きの方程式", "分数係数の方程式", "小数係数の方程式", "連立方程式（統合）"]
            },
            {
                name: "文章題演習",
                subtopics: ["金銭問題(基)", "数の問題(基)", "割合(準備)", "割合(標準)", "濃度(準備)", "食塩濃度(標)", "速度(準備)", "速度問題(標1)", "速度問題(標2)", "速度問題(標3)"]
            }
        ]
    },
    {
        name: "図形の性質",
        groups: [
            {
                name: "角度の計算",
                subtopics: ["角度 基礎", "平行線の錯角・同位角（基本）", "三角形と角（基本）", "三角形と角（標）", "角度（基本）", "角度（応用）", "二等辺三角形(角度)", "三・四角形(角度)"]
            },
            {
                name: "合同と証明の基礎",
                subtopics: ["合同条件(基)", "合同の証明(基)", "合同の証明(標)", "二等辺三角形(準)", "直角三角形(準)"]
            },
            {
                name: "図形の証明(発展)",
                subtopics: ["二等辺三角形(証)", "直角三角形(証)", "正三角形(証)", "平行四辺形(証)", "三・四角形(証明)", "証明（応用）", "証明（EX）"]
            },
            {
                name: "四角形の性質",
                subtopics: ["四角形の性質(基)", "四角形の関係"]
            }
        ]
    },
    {
        name: "一次関数",
        groups: [
            {
                name: "グラフの作成",
                subtopics: ["表からｸﾞﾗﾌを書く", "2点でｸﾞﾗﾌを書く", "2点でｸﾞﾗﾌを書く2", "切片と傾きで書く"]
            },
            {
                name: "式の決定",
                subtopics: ["切片を求める", "傾きを求める", "ｸﾞﾗﾌの式を求める", "ｸﾞﾗﾌから式1", "ｸﾞﾗﾌから式2", "ｸﾞﾗﾌから式3(発展)", "1点と傾きから(基)", "1点と切片から(基)", "2点から式を(基)", "1次関数の式1", "1次関数の式2", "1次関数の式3"]
            },
            {
                name: "関数の特徴と応用",
                subtopics: ["1次関数の変化の割合", "グラフの変域", "2直線の交点", "グラフと面積1", "グラフと面積2", "1次関数の利用(基)"]
            }
        ]
    },
    {
        name: "確率",
        groups: [
            {
                name: "基本演習",
                subtopics: ["サイコロ1個の確率(基)", "1個の確率問題", "ボール1個の確率(基)"]
            },
            {
                name: "2つの事象",
                subtopics: ["サイコロ2個の確率(基)", "サイコロ2個の確率(標)", "サイコロ2個の確率(応)", "ボール2個の確率(標)"]
            },
            {
                name: "数え上げと応用",
                subtopics: ["樹形図に表す", "樹形図に表す(標)", "区別できない時"]
            }
        ]
    }
];

export const difficultyMap: Record<string, number> = {
    // --- 式の計算 ---
    "式の次数": 1, "同類項の加減(基)": 1, "数値代入(基)": 1, "式の乗法(基)": 1, "式の二乗(基)": 1, "式の除法(初1)": 1,
    "同類項の加減(標1)": 2, "(#+#)+(#+#)": 2, "(#+#)-(#+#)": 2, "数値代入(標1)": 2, "等式の変形(基)": 2, "式の除法(基1)": 2,
    "縦書きの加法": 3, "減法": 3, "分数式の加減(基礎)": 3, "#(#+#)±#(#+#)": 3, "等式の変形(標1)": 3, "式の乗法(標)": 3, "式の除法(標1)": 3, "乗除の混合型1": 3,
    "等式の変形(標2)": 4, "文字式(完成1)": 4, "文字式の値(完)": 4, "分数式の加減(標準1)": 4,
    "式の変形(完)": 5, "文字式(完成2)": 5,

    // --- 連立方程式 ---
    "加減法（ガイド付き）": 2, "代入法（ガイド付き）": 2,
    "加減法（計算練習）①": 3, "代入法（計算練習）①": 3, "()付きの方程式": 3,
    "連立方程式（統合）": 4, "金銭問題(基)": 4, "数の問題(基)": 4, "割合(準備)": 4, "速度(準備)": 4,
    "割合(標準)": 5, "食塩濃度(標)": 5, "速度問題(標3)": 5,

    // --- 図形の性質 ---
    "角度 基礎": 1, "平行線の錯角・同位角（基本）": 1, "三角形と角（基本）": 1, "合同条件(基)": 1,
    "角度（基本）": 2, "二等辺三角形(角度)": 2, "三・四角形(角度)": 2, "四角形の性質(基)": 2,
    "角度（応用）": 3, "合同の証明(基)": 3, "二等辺三角形(準)": 3, "四角形の関係": 3,
    "二等辺三角形(証)": 4, "直角三角形(証)": 4, "正三角形(証)": 4, "平行四辺形(証)": 4,
    "証明（応用）": 5, "証明（EX）": 5, "三・四角形(証明)": 5,

    // --- 一次関数 ---
    "表からｸﾞﾗﾌを書く": 2, "切片を求める": 2, "傾きを求める": 2,
    "2点でｸﾞﾗﾌを書く": 3, "切片と傾きで書く": 3, "ｸﾞﾗﾌから式1": 3, "1次関数の変化の割合": 3,
    "2直線の交点": 4, "グラフの変域": 4, "1次関数の利用(基)": 4,
    "グラフと面積1": 5, "グラフと面積2": 5,

    // --- 確率 ---
    "サイコロ1個の確率(基)": 1, "ボール1個の確率(基)": 1,
    "サイコロ2個の確率(基)": 2, "樹形図に表す": 3,
    "サイコロ1個の確率(標)": 3, "カード1枚の確率(標)": 3,
    "サイコロ2個の確率(標)": 4, "区別できない時": 4,
    "サイコロ2個の確率(応)": 5,
};

const getDifficulty = (category: string): number => {
    return difficultyMap[category] || 3;
};

const ABILITIES: Ability[] = [
    { type: 'DEFENSIVE_STANCE', description: '[防御] このラウンドで敗北しても失点しない。' },
    { type: 'TIME_PRESSURE', value: 3, description: '[速攻] 相手の解答時間を3秒短縮する。' },
    { type: 'SCORE_BOOST', value: 1, description: '[激励] このラウンドで勝利した場合、追加で1スコアを得る。' },
];

const assignAbility = (card: ProblemCard): Ability | undefined => {
    if (card.difficulty < 3) return undefined;
    const abilityMap: { [key: string]: AbilityType[] } = {
        "図形の性質": ['DEFENSIVE_STANCE'],
        "確率": ['DEFENSIVE_STANCE', 'SCORE_BOOST'],
        "一次関数": ['TIME_PRESSURE', 'SCORE_BOOST'],
        "連立方程式": ['TIME_PRESSURE'],
        "式の計算": ['SCORE_BOOST'],
    };
    const possibleTypes = abilityMap[card.mainCategory];
    if (!possibleTypes) return undefined;
    if (Math.random() < 0.25) {
        const randomType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
        return ABILITIES.find(a => a.type === randomType);
    }
    return undefined;
}

const processProblems = (): ProblemCard[] => {
    const allProblems: ProblemCard[] = [];
    let idCounter = 0;
    const sets = [
        { mainCat: "式の計算", problems: polynomialProblems },
        { mainCat: "連立方程式", problems: simultaneousEquationsProblems },
        { mainCat: "図形の性質", problems: geometryProblems },
        { mainCat: "一次関数", problems: linearFunctionsProblems },
        { mainCat: "確率", problems: probabilityProblems },
    ];
    for (const set of sets) {
        for (const category in set.problems) {
            const difficulty = getDifficulty(category);
            for (const problem of (set.problems as any)[category]) {
                const card: ProblemCard = {
                    id: idCounter++,
                    mainCategory: set.mainCat,
                    category,
                    difficulty,
                    problem: problem as Problem,
                };
                card.ability = assignAbility(card);
                allProblems.push(card);
            }
        }
    }
    return allProblems;
}

export const CARD_DEFINITIONS: ProblemCard[] = processProblems();
