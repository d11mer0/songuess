export interface AchievementDefinition {
    id: string;
    titleUk: string;
    titleEn: string;
    descUk: string;
    descEn: string;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    category: 'GAMEPLAY' | 'DAILY' | 'DONATION' | 'SOCIAL';
}

export const ACHIEVEMENTS_BANK: AchievementDefinition[] = [
    {
        id: 'FIRST_WIN',
        titleUk: 'Перша перемога',
        titleEn: 'First Victory',
        descUk: 'Здобути першу перемогу в будь-якій грі або раунді',
        descEn: 'Win your first game match or round',
        icon: '🏆',
        rarity: 'COMMON',
        category: 'GAMEPLAY',
    },
    {
        id: 'SNIPER_1S',
        titleUk: 'Музичний снайпер',
        titleEn: 'Music Sniper',
        descUk: 'Вгадати трек менш ніж за 1.0 секунду після запуску',
        descEn: 'Guess a track in under 1.0 second after launch',
        icon: '🎯',
        rarity: 'RARE',
        category: 'GAMEPLAY',
    },
    {
        id: 'COMBO_5X',
        titleUk: 'Майстер комбо',
        titleEn: 'Combo Master',
        descUk: 'Дати 5 правильних відповідей поспіль в одній грі',
        descEn: 'Achieve a 5x correct answer streak in a game',
        icon: '🔥',
        rarity: 'EPIC',
        category: 'GAMEPLAY',
    },
    {
        id: 'DAILY_STREAK_7',
        titleUk: 'Музичний марафон',
        titleEn: 'Music Marathon',
        descUk: 'Вгадувати «Пісню Дня» 7 днів поспіль',
        descEn: 'Maintain a 7-day streak in the Daily Challenge',
        icon: '⚡',
        rarity: 'EPIC',
        category: 'DAILY',
    },
    {
        id: 'HEARDLE_PRO',
        titleUk: 'Прогресивний слухач',
        titleEn: 'Progressive Sleuth',
        descUk: 'Вгадати трек у Heardle-режимі за перші 2 спроби',
        descEn: 'Guess a Heardle track within the first 2 attempts',
        icon: '🎧',
        rarity: 'RARE',
        category: 'GAMEPLAY',
    },
    {
        id: 'DUEL_GLADIATOR',
        titleUk: 'Гладіатор дуелей',
        titleEn: 'Duel Gladiator',
        descUk: 'Перемогти суперника у бліц-дуелі 1-на-1',
        descEn: 'Defeat an opponent in a 1-on-1 blitz duel',
        icon: '⚔️',
        rarity: 'RARE',
        category: 'GAMEPLAY',
    },
    {
        id: 'CENTURION_100',
        titleUk: 'Центуріон SonGuess',
        titleEn: 'SonGuess Centurion',
        descUk: 'Набрати сумарно понад 5000 очок або зіграти 100 раундів',
        descEn: 'Score over 5,000 total points or play 100 rounds',
        icon: '👑',
        rarity: 'LEGENDARY',
        category: 'GAMEPLAY',
    },
    {
        id: 'PATRON_DONOR',
        titleUk: 'Меценат SonGuess',
        titleEn: 'Generous Patron',
        descUk: 'Підтримати проєкт донатом або оформити Преміум',
        descEn: 'Support the project via LiqPay donation or VIP status',
        icon: '💎',
        rarity: 'LEGENDARY',
        category: 'DONATION',
    },
];