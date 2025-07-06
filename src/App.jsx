import styled from 'styled-components'
import './App.css'
import { FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import React, { useState, useEffect, useRef } from 'react'
import AdminPanel from './AdminPanel'
import { fetchCategories, fetchCategoryById, fetchCategoryUpvotes, fetchItemsForCategory } from './dbUtils'
import { useSpring, animated, useSprings, config } from '@react-spring/web';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const BABY_BLUE = '#b3d8fd';
const NEON_BABY_BLUE = '#4fd1ff';
const GREY_BABY_BLUE = '#b3c7d8';
const BAR_WIDTH_NUM = 620;
const BAR_HEIGHT_NUM = 48;
const BORDER_RADIUS = 16;
const DARKER_BLUE = '#2563eb';
const NEON_GREEN = '#39ff14';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const AnimatedTitleWrapper = styled.div`
  margin-top: 32px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
`;

const AnimatedTitleSVG = styled.svg`
  width: 520px;
  height: 120px;
  display: block;
  overflow: visible;
`;

const SearchWrapper = styled.div`
  margin-top: 48px;
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 20;
`;

const CenteredBarWrapper = styled.div`
  width: ${BAR_WIDTH_NUM}px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: visible;
  position: relative;
  z-index: 20;
  transition: margin-top 0.35s cubic-bezier(.77,0,.18,1);
`;

const AnimatedBorderSVG = styled.svg`
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
`;

const SearchBarDropdownWrapper = styled.div`
  width: 100%;
  background: #fff;
  border-radius: ${BORDER_RADIUS}px ${BORDER_RADIUS}px 0 0;
  transition: background 0.2s;
  position: relative;
`;

const SearchBar = styled.div`
  position: relative;
  width: 100%;
  height: ${BAR_HEIGHT_NUM}px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-radius: ${BORDER_RADIUS}px;
  background: #f3f4f6;
  z-index: 30;
  overflow: hidden;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 100%;
  padding: 12px 24px 12px 24px;
  border-radius: ${BORDER_RADIUS}px;
  border: none;
  background: transparent;
  font-size: 1.1rem;
  box-shadow: none;
  outline: none;
  transition: none;
  color: #22223b;
  font-family: inherit;
  text-align: left;
  position: relative;
  z-index: 2;
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 1.5rem;
  pointer-events: none;
`;

const CategoriesWrapper = styled.div`
  margin-top: 20px;
  width: 100%;
  display: flex;
  gap: 8px;
  box-sizing: border-box;
`;

const CategoryButton = styled.button`
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 24px;
  background: none;
  color: #22223b;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover, &:focus {
    color: #22223b;
    outline: none;
  }
`;

const DropdownIconWrapper = styled.span`
  display: flex;
  align-items: center;
  margin-left: 8px;
  cursor: pointer;
`;

const DropdownPanel = styled.div`
  width: 100%;
  margin-top: 0;
  background: #fff;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 4px 24px rgba(34,34,59,0.10);
  padding: 32px 24px;
  display: ${({ open }) => (open ? 'block' : 'none')};
  position: static;
  z-index: 2;
  box-sizing: border-box;
  overflow: hidden;
`;

const ContentBlock = styled.div`
  width: 100%;
  max-width: 700px;
  min-height: 550px;
  background: #f6f7fa;
  border-radius: 18px;
  margin-top: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #22223b;
  box-shadow: 0 2px 16px rgba(34,34,59,0.04);
  padding: 48px;
`;

const TabHeaderRow = styled.div`
  display: flex;
  width: 100%;
  background: #f6f7fa;
  border-radius: 18px 18px 0 0;
  border-bottom: 1px solid #e0e4ea;
  position: relative;
`;

const TabHeader = styled.button`
  flex: 1;
  padding: 18px 0 12px 0;
  background: none;
  border: none;
  font-size: 1.18rem;
  font-weight: ${props => (props.active ? 700 : 500)};
  color: #22223b;
  border-radius: 18px 18px 0 0;
  cursor: pointer;
  outline: none;
  box-shadow: none !important;
  border-bottom: none;
  transition: font-weight 0.15s;
  &:hover, &:focus {
    color: #22223b;
    background: none;
    outline: none;
    box-shadow: none !important;
  }
  &:active {
    outline: none;
    box-shadow: none !important;
  }
`;

const SearchResultsDropdown = styled.div`
  width: 99%;
  margin-left: 0.5%;
  min-height: 0;
  background: #fff;
  border-radius: 0 0 ${BORDER_RADIUS}px ${BORDER_RADIUS}px;
  box-shadow: 0 8px 32px 8px rgba(34,34,59,0.08);
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #e0e4ea;
  border-top: none;
  opacity: ${props => (props.visible ? 1 : 0)};
  pointer-events: ${props => (props.visible ? 'auto' : 'none')};
  transition: opacity 0.35s cubic-bezier(.77,0,.18,1);
  z-index: 9999;
  margin-top: -2px;
`;

const SearchResultItem = styled.div`
  padding: 13.3px 24px;
  cursor: pointer;
  font-size: 1.08rem;
  color: #22223b;
  text-align: left;
  background: #fff;
  &:hover {
    background: #f6f7fa;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #eaeaea;
  margin: 0 16px;
`;

// Placeholder for UpVote images
const UpvoteImagesRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  width: 100%;
  height: 260px;
`;

const ImagePlaceholder = styled.div`
  width: 240px;
  height: 280px;
  background: #d1d5db;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #888;
  box-shadow: 0 2px 8px rgba(34,34,59,0.06);
`;

const OrText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #b0b0b0;
  margin: 0 12px;
`;

const ItemName = styled.div`
  margin-top: 6px;
  font-size: 1.25rem;
  color: #111;
  font-weight: 600;
  text-align: center;
`;

// Rank list styles
const RankList = styled.div`
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
`;

const RankItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  font-size: 1.13rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  &:nth-child(odd) {
    background: #f7f8fa;
  }
`;

const RankNum = styled.span`
  font-weight: 700;
  color: #2563eb;
  width: 2.2em;
  text-align: right;
`;

const RankName = styled.span`
  flex: 1;
  margin-left: 16px;
  text-align: left;
  font-weight: 500;
  color: #22223b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RankScore = styled.span`
  font-weight: 600;
  color: #444;
  margin-left: 16px;
  min-width: 2.5em;
  text-align: right;
`;

const DownArrow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 18px 0 0 0;
  cursor: pointer;
  color: #2563eb;
  font-size: 2.1rem;
  transition: color 0.15s;
  &:hover { color: #1e40af; }
`;

// Add with other styled-components
const SportsDropdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, auto);
  gap: 18px 24px;
  padding: 18px 12px 8px 12px;
`;
const SportsSubtitle = styled.div`
  font-weight: 700;
  font-size: 0.98rem;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  text-align: center;
`;
const SportsCatLink = styled.div`
  font-size: 0.88rem;
  color: #2563eb;
  cursor: pointer;
  margin-bottom: 3px;
  padding: 2px 0 2px 0;
  border-radius: 6px;
  transition: background 0.13s;
  &:hover {
    background: #e6f0ff;
    color: #174ea6;
  }
`;

function AnimatedUpVoteTitle({ logoRef }) {
  // Animation: always visible dark blue text, baby blue fills up, then dark blue fills up, no pulse
  return (
    <AnimatedTitleWrapper ref={logoRef}>
      <AnimatedTitleSVG viewBox="0 0 520 120">
        <defs>
          <linearGradient id="babyFill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={BABY_BLUE} />
            <stop offset="100%" stopColor={BABY_BLUE} />
          </linearGradient>
          <linearGradient id="darkFill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={DARKER_BLUE} />
            <stop offset="100%" stopColor={DARKER_BLUE} />
          </linearGradient>
          {/* Baby blue mask animates up first, then dark blue mask animates up */}
          <mask id="babyMask">
            <rect x="0" y="0" width="520" height="120" fill="white">
              <animate attributeName="y" values="120;0;0;120" keyTimes="0;0.2;0.7;1" dur="14s" repeatCount="indefinite" />
              <animate attributeName="height" values="0;120;120;0" keyTimes="0;0.2;0.7;1" dur="14s" repeatCount="indefinite" />
            </rect>
          </mask>
          <mask id="darkMask">
            <rect x="0" y="0" width="520" height="120" fill="white">
              <animate attributeName="y" values="120;120;0;0;120" keyTimes="0;0.2;0.45;0.95;1" dur="14s" repeatCount="indefinite" />
              <animate attributeName="height" values="0;0;120;120;0" keyTimes="0;0.2;0.45;0.95;1" dur="14s" repeatCount="indefinite" />
            </rect>
          </mask>
        </defs>
        {/* Always visible dark blue text */}
        <text x="50%" y="85" textAnchor="middle"
          fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
          fontWeight="800"
          fontSize="5.2rem"
          letterSpacing="-2px"
          fill={DARKER_BLUE}
        >
          Vootes
        </text>
        {/* Baby blue fill animates up */}
        <text x="50%" y="85" textAnchor="middle"
          fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
          fontWeight="800"
          fontSize="5.2rem"
          letterSpacing="-2px"
          fill="url(#babyFill)"
          mask="url(#babyMask)"
        >
          Vootes
        </text>
        {/* Dark blue fill animates up over baby blue */}
        <text x="50%" y="85" textAnchor="middle"
          fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
          fontWeight="800"
          fontSize="5.2rem"
          letterSpacing="-2px"
          fill="url(#darkFill)"
          mask="url(#darkMask)"
        >
          Vootes
        </text>
        {/* Subtitle */}
        <text x="50%" y="115" textAnchor="middle"
          fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
          fontWeight="400"
          fontSize="1.1rem"
          fill="#666666"
        >
          Every vote counts. Especially yours.
        </text>
      </AnimatedTitleSVG>
    </AnimatedTitleWrapper>
  );
}

function App() {
  const categories = [
    'Sports',
    'Movies & TV',
    'History',
    'Science',
    'Other',
  ];
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('UpVote');
  const [searchTerm, setSearchTerm] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [categoryUpvotes, setCategoryUpvotes] = useState(null);
  const contentBlockRef = useRef(null);
  const categoriesWrapperRef = useRef(null);
  const logoRef = useRef(null);

  // SVG border animation values
  const borderLength = 2 * (BAR_WIDTH_NUM + BAR_HEIGHT_NUM - 2 * BORDER_RADIUS) + 2 * Math.PI * BORDER_RADIUS;

  // Load all categories on mount
  useEffect(() => {
    fetchCategories('').then(results => {
      setAllCategories(results);
      setSearchResults(results);
    });
  }, []);

  // Filter categories in-memory as user types
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(allCategories);
    } else {
      setSearchResults(
        allCategories.filter(cat =>
          cat.name && cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, allCategories]);

  // Calculate dropdown height for animation (1-3 results, or 1 for 'no results')
  const resultCount = (showResults && searchTerm.trim() !== '') ? Math.max(1, Math.min(searchResults.length, 3)) : 0;
  const dropdownHeightValue = (showResults && searchTerm.trim() !== '') ? resultCount * 44 : 0; // 44px per result
  const dropdownSpring = useSpring({
    height: dropdownHeightValue,
    config: { tension: 210, friction: 39 },
  });

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryById(selectedCategory.id).then(setCategoryInfo);
      fetchCategoryUpvotes(selectedCategory.id).then(setCategoryUpvotes);
    } else {
      setCategoryInfo(null);
      setCategoryUpvotes(null);
    }
  }, [selectedCategory]);

  // Animation durations
  const TABS_ANIMATION_DURATION = 650;
  const INFO_ANIMATION_DURATION = 650;
  const IMAGES_ANIMATION_DURATION = 320;

  // Tabs move down with a fixed duration
  const tabsSpring = useSpring({
    transform: selectedCategory ? 'translateY(112px)' : 'translateY(0px)',
    config: { duration: TABS_ANIMATION_DURATION },
  });

  // Info block fades in after tabs move down
  const infoSpring = useSpring({
    opacity: selectedCategory ? 1 : 0,
    transform: selectedCategory ? 'translateY(0px)' : 'translateY(-24px)',
    config: { duration: INFO_ANIMATION_DURATION },
    delay: selectedCategory ? TABS_ANIMATION_DURATION : 0,
  });

  // Shake animation for each image
  const [shake1, setShake1] = useSpring(() => ({ rotate: 0 }));
  const [shake2, setShake2] = useSpring(() => ({ rotate: 0 }));

  const imagesSpring = useSpring({
    opacity: selectedCategory ? 1 : 0,
    filter: selectedCategory ? 'blur(0px)' : 'blur(4px)',
    config: { duration: IMAGES_ANIMATION_DURATION },
    delay: selectedCategory ? TABS_ANIMATION_DURATION : 0,
  });

  // Animated sliding underline for tabs
  const tabLabels = ['UpVote', 'Results', 'List'];
  const [underlineSpring, setUnderlineSpring] = useSpring(() => ({ left: 0, width: 0 }));
  const tabHeaderRowRef = useRef(null);
  const tabRefs = useRef(tabLabels.map(() => React.createRef()));
  useEffect(() => {
    if (tabHeaderRowRef.current && tabRefs.current[activeTabIndex()]) {
      const tabNode = tabRefs.current[activeTabIndex()].current;
      if (tabNode) {
        const rowRect = tabHeaderRowRef.current.getBoundingClientRect();
        const tabRect = tabNode.getBoundingClientRect();
        setUnderlineSpring.start({
          left: tabRect.left - rowRect.left,
          width: tabRect.width
        });
      }
    }
  }, [activeTab, setUnderlineSpring]);
  function activeTabIndex() {
    return tabLabels.findIndex(label => label === activeTab);
  }

  // Title/upvotes and description typing/fade-in effect
  const TITLE_ANIMATION_DURATION = 320;
  const DESC_ANIMATION_DURATION = 320;
  const DESC_ANIMATION_DELAY = TABS_ANIMATION_DURATION + 80; // start after tabs and a bit after title

  const titleSpring = useSpring({
    opacity: selectedCategory ? 1 : 0,
    clipPath: selectedCategory ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
    config: { duration: TITLE_ANIMATION_DURATION },
    delay: selectedCategory ? TABS_ANIMATION_DURATION : 0,
  });

  const upvotesSpring = useSpring({
    opacity: selectedCategory ? 1 : 0,
    clipPath: selectedCategory ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
    config: { duration: TITLE_ANIMATION_DURATION },
    delay: selectedCategory ? TABS_ANIMATION_DURATION + 60 : 0,
  });

  const descSpring = useSpring({
    opacity: selectedCategory ? 1 : 0,
    clipPath: selectedCategory ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
    config: { duration: DESC_ANIMATION_DURATION },
    delay: selectedCategory ? DESC_ANIMATION_DELAY : 0,
  });

  // State for rank tab pagination and items
  const [rankPage, setRankPage] = useState(0);
  const [rankItems, setRankItems] = useState([]);

  // Fetch items for selected category when Rank tab is active and category changes
  useEffect(() => {
    if (activeTab === 'Results' && selectedCategory) {
      import('./dbUtils').then(utils => {
        utils.fetchItemsForCategory(selectedCategory.id).then(items => {
          const sorted = [...items].sort((a, b) => (b.indexScore || 0) - (a.indexScore || 0));
          setRankItems(sorted);
          setRankPage(0);
        });
      });
    } else {
      setRankItems([]);
      setRankPage(0);
    }
  }, [activeTab, selectedCategory]);

  // Animate rank items fade-in in order
  const visibleRankItems = rankItems.slice(rankPage * 10, (rankPage + 1) * 10);

  // UpVote game state
  const [gameItems, setGameItems] = useState([]); // all items for category
  const [currentPair, setCurrentPair] = useState([null, null]); // [A, B]
  const [lastWinnerId, setLastWinnerId] = useState(null);
  const [lockInReady, setLockInReady] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);

  // Animation for new challenger fade-in
  const [fadeInIdx, setFadeInIdx] = useState(null); // 0 or 1 for which side fades in
  const fadeInSpring = useSpring({
    opacity: fadeInIdx !== null ? 1 : 0,
    config: { duration: 800 }, // even slower fade in
    delay: fadeInIdx !== null ? 200 : 0, // 0.2s delay before fade in
    reset: true,
  });

  // Pulse animation for item names
  const [namePulse0, namePulseApi0] = useSpring(() => ({ scale: 1 }));
  const [namePulse1, namePulseApi1] = useSpring(() => ({ scale: 1 }));

  // Neon green border fade-in for winning image
  const [borderSpring0, borderApi0] = useSpring(() => ({ borderOpacity: 0 }));
  const [borderSpring1, borderApi1] = useSpring(() => ({ borderOpacity: 0 }));

  // Track which item is disappearing (for instant feedback)
  const [disappearingIdx, setDisappearingIdx] = useState(null); // 0 or 1
  const [disappearSpring0, disappearApi0] = useSpring(() => ({ opacity: 1 }));
  const [disappearSpring1, disappearApi1] = useSpring(() => ({ opacity: 1 }));

  // Track consecutive picks for the current winner
  const [winnerStreak, setWinnerStreak] = useState(1);
  // Track top 5 item IDs for the selected category
  const [top5Ids, setTop5Ids] = useState([]);

  // Fetch top 5 item IDs when category changes or after each vote
  useEffect(() => {
    async function fetchTop5() {
      if (!selectedCategory) return setTop5Ids([]);
      const items = await fetchItemsForCategory(selectedCategory.id);
      const sorted = [...items].sort((a, b) => (b.indexScore || 0) - (a.indexScore || 0));
      setTop5Ids(sorted.slice(0, 5).map(it => it.id));
    }
    fetchTop5();
  }, [selectedCategory]);

  // Update streak after each vote
  useEffect(() => {
    if (!currentPair[0] && !currentPair[1]) return;
    if (lastWinnerId && (currentPair[0]?.id === lastWinnerId || currentPair[1]?.id === lastWinnerId)) {
      setWinnerStreak(s => s + 1);
    } else {
      setWinnerStreak(1);
    }
  }, [lastWinnerId]);

  // Fetch items for UpVote game when category changes
  useEffect(() => {
    if (activeTab === 'UpVote' && selectedCategory) {
      setGameLoading(true);
      fetchItemsForCategory(selectedCategory.id).then(items => {
        setGameItems(items);
        // Pick two random items from the lower half of indexScore
        if (items.length >= 2) {
          const sorted = [...items].sort((a, b) => (a.indexScore || 0) - (b.indexScore || 0));
          const lowerHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
          const idxs = [];
          while (idxs.length < 2 && lowerHalf.length > 1) {
            const idx = Math.floor(Math.random() * lowerHalf.length);
            if (!idxs.includes(idx)) idxs.push(idx);
          }
          setCurrentPair([lowerHalf[idxs[0]], lowerHalf[idxs[1]]]);
        } else {
          setCurrentPair([null, null]);
        }
        setLastWinnerId(null);
        setLockInReady(false);
        setGameLoading(false);
      });
    } else {
      setGameItems([]);
      setCurrentPair([null, null]);
      setLastWinnerId(null);
      setLockInReady(false);
    }
  }, [activeTab, selectedCategory]);

  // ELO update function
  function updateElo(winner, loser, K = 32) {
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.indexScore - winner.indexScore) / 400));
    const expectedLoser = 1 - expectedWinner;
    const newWinnerScore = winner.indexScore + K * (1 - expectedWinner);
    const newLoserScore = loser.indexScore + K * (0 - expectedLoser);
    return {
      winner: { ...winner, indexScore: Math.round(newWinnerScore) },
      loser: { ...loser, indexScore: Math.round(newLoserScore) }
    };
  }

  // Add at the top of App():
  const [imgPulse0, imgPulseApi0] = useSpring(() => ({ scale: 1 }));
  const [imgPulse1, imgPulseApi1] = useSpring(() => ({ scale: 1 }));

  // In handleVote, after fade out and before updating state, trigger the pulse for the winner image:
  function handleVote(winnerIdx) {
    if (!currentPair[0] || !currentPair[1]) return;
    const loserIdx = 1 - winnerIdx;
    setDisappearingIdx(loserIdx);
    (loserIdx === 0 ? disappearApi0 : disappearApi1).start({ opacity: 0, config: { duration: 220 } });
    // Pulse the image of the winning item
    if (winnerIdx === 0) {
      imgPulseApi0.start({
        from: { scale: 1 },
        to: async (next) => {
          await next({ scale: 1.1 });
          await next({ scale: 1 });
        },
        config: { tension: 500, friction: 8 },
      });
      namePulseApi0.start({
        from: { scale: 1 },
        to: async (next) => {
          await next({ scale: 1.18 });
          await next({ scale: 1 });
        },
        config: { tension: 400, friction: 8 },
      });
      borderApi0.start({ borderOpacity: 1, config: { duration: 900 } });
      setTimeout(() => borderApi0.start({ borderOpacity: 0, config: { duration: 400 } }), 1200);
    } else {
      imgPulseApi1.start({
        from: { scale: 1 },
        to: async (next) => {
          await next({ scale: 1.1 });
          await next({ scale: 1 });
        },
        config: { tension: 500, friction: 8 },
      });
      namePulseApi1.start({
        from: { scale: 1 },
        to: async (next) => {
          await next({ scale: 1.18 });
          await next({ scale: 1 });
        },
        config: { tension: 400, friction: 8 },
      });
      borderApi1.start({ borderOpacity: 1, config: { duration: 900 } });
      setTimeout(() => borderApi1.start({ borderOpacity: 0, config: { duration: 400 } }), 1200);
    }
    // After fade out, do calculations and show next matchup optimistically
    setTimeout(() => {
      // Optimistically update local gameItems and currentPair
      const winner = currentPair[winnerIdx];
      const loser = currentPair[loserIdx];
      const { winner: updatedWinner, loser: updatedLoser } = updateElo(winner, loser);
      // Update local gameItems
      let updatedGameItems = gameItems.map(it => {
        if (it.id === updatedWinner.id) return { ...it, indexScore: updatedWinner.indexScore };
        if (it.id === updatedLoser.id) return { ...it, indexScore: updatedLoser.indexScore };
        return it;
      });
      // Winner stays, pick new challenger from local items
      const winnerItem = updatedGameItems.find(it => it.id === updatedWinner.id);
      let candidates = updatedGameItems.filter(it => it.id !== winnerItem.id && it.indexScore > loser.indexScore);
      if (candidates.length === 0) {
        candidates = updatedGameItems.filter(it => it.id !== winnerItem.id);
      }
      let newChallenger = null;
      if (candidates.length > 0) {
        newChallenger = candidates[Math.floor(Math.random() * candidates.length)];
      }
      const newPair = [...currentPair];
      newPair[winnerIdx] = winnerItem;
      newPair[loserIdx] = newChallenger;
      setCurrentPair(newPair);
      setGameItems(updatedGameItems);
      setFadeInIdx(loserIdx); // fade in the new challenger
      // Reset fade and disappearing state
      (loserIdx === 0 ? disappearApi0 : disappearApi1).set({ opacity: 1 });
      setDisappearingIdx(null);
      setTimeout(() => setFadeInIdx(null), 300);
      // Firestore writes in background
      updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedWinner.id), { indexScore: updatedWinner.indexScore });
      updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedLoser.id), { indexScore: updatedLoser.indexScore });
      // Increment upvotes for the category in Firestore and locally
      if (selectedCategory) {
        setCategoryUpvotes(u => (u || 0) + 1);
        updateDoc(doc(db, 'categories', selectedCategory.id), { upvotes: increment(1) });
      }
    }, 240); // match fade out duration
  }

  // Handle Lock In as #1 button click
  async function handleLockInAs1(idx) {
    if (!currentPair[idx] || !currentPair[1-idx]) return;
    const winner = currentPair[idx];
    // Pick a random challenger from the lower half (not the winner)
    const sorted = [...gameItems].sort((a, b) => (a.indexScore || 0) - (b.indexScore || 0));
    const lowerHalf = sorted.slice(0, Math.ceil(sorted.length / 2)).filter(it => it.id !== winner.id);
    let challenger = null;
    if (lowerHalf.length > 0) {
      challenger = lowerHalf[Math.floor(Math.random() * lowerHalf.length)];
    } else {
      challenger = gameItems.find(it => it.id !== winner.id);
    }
    if (!challenger) return;
    // ELO update: treat as a win for winner, loss for challenger
    const { winner: updatedWinner, loser: updatedLoser } = updateElo(winner, challenger);
    // Optimistically update local gameItems
    let updatedGameItems = gameItems.map(it => {
      if (it.id === updatedWinner.id) return { ...it, indexScore: updatedWinner.indexScore };
      if (it.id === updatedLoser.id) return { ...it, indexScore: updatedLoser.indexScore };
      return it;
    });
    setGameItems(updatedGameItems);
    // Firestore writes in background
    updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedWinner.id), { indexScore: updatedWinner.indexScore });
    updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedLoser.id), { indexScore: updatedLoser.indexScore });
    // Pick two new random lower-half players
    const newSorted = [...updatedGameItems].sort((a, b) => (a.indexScore || 0) - (b.indexScore || 0));
    const newLowerHalf = newSorted.slice(0, Math.ceil(newSorted.length / 2));
    const idxs = [];
    while (idxs.length < 2 && newLowerHalf.length > 1) {
      const i = Math.floor(Math.random() * newLowerHalf.length);
      if (!idxs.includes(i)) idxs.push(i);
    }
    setCurrentPair([newLowerHalf[idxs[0]], newLowerHalf[idxs[1]]]);
    setLastWinnerId(null);
    setLockInReady(false);
    setWinnerStreak(1);
  }

  // Format upvotes (e.g. 1.1k, 1.1M)
  function formatUpvotes(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num;
  }

  // When loading a category, fetch upvotes
  useEffect(() => {
    async function fetchUpvotes() {
      if (!selectedCategory) return setCategoryUpvotes(null);
      const snap = await getDoc(doc(db, 'categories', selectedCategory.id));
      setCategoryUpvotes(snap.exists() && snap.data().upvotes ? snap.data().upvotes : 0);
    }
    fetchUpvotes();
  }, [selectedCategory]);

  // Add new useSpring for results parent
  const [resultsParentSpring, resultsParentApi] = useSpring(() => ({ opacity: 1 }));

  useEffect(() => {
    if (activeTab === 'Results' && selectedCategory) {
      resultsParentApi.set({ opacity: 0 });
      setTimeout(() => {
        resultsParentApi.start({ opacity: 1, config: { duration: 400 } });
      }, 40);
    } else {
      resultsParentApi.set({ opacity: 1 });
    }
  }, [activeTab, selectedCategory, rankPage, resultsParentApi]);

  // Add with other useState
  const [pendingScroll, setPendingScroll] = useState(false);

  // Replace the previous useEffect for selectedCategory shake with this:
  useEffect(() => {
    if (selectedCategory) {
      if (pendingScroll) {
        setTimeout(() => {
          if (contentBlockRef.current && logoRef.current) {
            const logoBottom = logoRef.current.getBoundingClientRect().bottom;
            const contentTop = contentBlockRef.current.getBoundingClientRect().top;
            const scrollY = window.scrollY || window.pageYOffset;
            const offset = contentTop - logoBottom;
            window.scrollTo({
              top: scrollY + offset,
              behavior: 'smooth'
            });
          }
          // Trigger shake after scroll
          setTimeout(() => {
            setTimeout(() => {
              setShake1.start({
                from: { rotate: 0 },
                to: async (next) => {
                  await next({ rotate: -15 });
                  await next({ rotate: 15 });
                  await next({ rotate: 0 });
                },
                config: { duration: 80 },
              });
              setTimeout(() => {
                setShake2.start({
                  from: { rotate: 0 },
                  to: async (next) => {
                    await next({ rotate: -15 });
                    await next({ rotate: 15 });
                    await next({ rotate: 0 });
                  },
                  config: { duration: 80 },
                });
              }, 500);
            }, 500);
          }, 250);
          setPendingScroll(false);
        }, 120);
      } else {
        // For search or other category changes, just shake after a short delay
        setTimeout(() => {
          setTimeout(() => {
            setShake1.start({
              from: { rotate: 0 },
              to: async (next) => {
                await next({ rotate: -15 });
                await next({ rotate: 15 });
                await next({ rotate: 0 });
              },
              config: { duration: 80 },
            });
            setTimeout(() => {
              setShake2.start({
                from: { rotate: 0 },
                to: async (next) => {
                  await next({ rotate: -15 });
                  await next({ rotate: 15 });
                  await next({ rotate: 0 });
                },
                config: { duration: 80 },
              });
            }, 500);
          }, 500);
        }, 350);
      }
    }
  }, [selectedCategory, pendingScroll]);

  return (
    <Container>
      <AnimatedUpVoteTitle logoRef={logoRef} />
      <SearchWrapper>
        <CenteredBarWrapper>
          <SearchBarDropdownWrapper>
            <SearchBar>
              <AnimatedBorderSVG
                width={BAR_WIDTH_NUM}
                height={BAR_HEIGHT_NUM}
              >
                <rect
                  x={1}
                  y={1}
                  width={BAR_WIDTH_NUM - 2}
                  height={BAR_HEIGHT_NUM - 2}
                  rx={BORDER_RADIUS}
                  fill="none"
                  stroke={searchFocused ? NEON_BABY_BLUE : GREY_BABY_BLUE}
                  strokeWidth={2}
                  strokeDasharray={borderLength}
                  strokeDashoffset={searchFocused ? 0 : borderLength}
                  style={{
                    transition: searchFocused
                      ? 'stroke-dashoffset 0.9s cubic-bezier(.77,0,.18,1), stroke 0.2s'
                      : 'stroke 0.2s',
                  }}
                />
              </AnimatedBorderSVG>
              <SearchInput
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  setShowResults(true);
                }}
                onBlur={() => {
                  setSearchFocused(false);
                  setTimeout(() => setShowResults(false), 120); // allow click
                }}
              />
              <SearchIcon />
            </SearchBar>
            <animated.div style={{ height: dropdownSpring.height }}>
              <SearchResultsDropdown visible={showResults && searchTerm.trim() !== ''}>
                {searchTerm.trim() !== '' && (
                  searchResults.length > 0 ? (
                    searchResults.slice(0, 3).map((cat, idx, arr) => (
                      <React.Fragment key={cat.id}>
                        <SearchResultItem key={cat.id} onClick={() => {
                          setSelectedCategory({ id: cat.id, name: cat.name });
                          setShowResults(false);
                          setSearchTerm('');
                          setTimeout(() => {
                            if (contentBlockRef.current && logoRef.current) {
                              const logoBottom = logoRef.current.getBoundingClientRect().bottom;
                              const contentTop = contentBlockRef.current.getBoundingClientRect().top;
                              const scrollY = window.scrollY || window.pageYOffset;
                              const offset = contentTop - logoBottom;
                              window.scrollTo({
                                top: scrollY + offset,
                                behavior: 'smooth'
                              });
                            }
                          }, 100);
                        }} style={{ cursor: 'pointer' }}>
                          {cat.name}
                        </SearchResultItem>
                        {idx < arr.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <SearchResultItem style={{ color: '#888', cursor: 'default' }}>No results match your search</SearchResultItem>
                  )
                )}
              </SearchResultsDropdown>
            </animated.div>
          </SearchBarDropdownWrapper>
        </CenteredBarWrapper>
      </SearchWrapper>
      <CenteredBarWrapper style={{ position: 'relative' }}>
        <CategoriesWrapper ref={categoriesWrapperRef}>
          {categories.map((cat, idx) => (
            <CategoryButton
              key={cat}
              style={{ borderRadius: openDropdown === idx ? '16px 16px 0 0' : '16px', borderBottom: openDropdown === idx ? '1px solid #e9ecef' : 'none', transition: 'border-radius 0.2s' }}
              onClick={() => {
                setOpenDropdown(openDropdown === idx ? null : idx);
              }}
            >
              {cat}
              <DropdownIconWrapper>
                <FiChevronDown style={{ transform: openDropdown === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} size={20} />
              </DropdownIconWrapper>
            </CategoryButton>
          ))}
        </CategoriesWrapper>
        <DropdownPanel open={openDropdown !== null}>
          {openDropdown !== null && (
            categories[openDropdown] === 'Sports' ? (
              <SportsDropdownGrid>
                <div>
                  <SportsSubtitle>Football ⚽️</SportsSubtitle>
                  <SportsCatLink
                    onClick={() => {
                      const cat = allCategories.find(c => c.name === 'All-Time Football Players');
                      if (cat) {
                        setSelectedCategory({ id: cat.id, name: cat.name });
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    All-Time Football Players
                  </SportsCatLink>
                </div>
                <div>
                  <SportsSubtitle>Basketball 🏀</SportsSubtitle>
                  <SportsCatLink
                    onClick={() => {
                      const cat = allCategories.find(c => c.name === 'Current NBA Players');
                      if (cat) {
                        setSelectedCategory({ id: cat.id, name: cat.name });
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    Current NBA Players
                  </SportsCatLink>
                  <SportsCatLink
                    onClick={() => {
                      const cat = allCategories.find(c => c.name === 'All-Time NBA Players');
                      if (cat) {
                        setSelectedCategory({ id: cat.id, name: cat.name });
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    All-Time NBA Players
                  </SportsCatLink>
                </div>
                <div>
                  <SportsSubtitle>American Football 🏈</SportsSubtitle>
                </div>
                <div>
                  <SportsSubtitle>Formula 1 🏎️</SportsSubtitle>
                </div>
                <div>
                  <SportsSubtitle>Golf ⛳️</SportsSubtitle>
                </div>
                <div>
                  <SportsSubtitle>Baseball ⚾️</SportsSubtitle>
                </div>
                <div>
                  <SportsSubtitle>Other 🏉</SportsSubtitle>
                </div>
              </SportsDropdownGrid>
            ) : (
              <div style={{ color: '#22223b', fontSize: '1.1rem' }}>
                {categories[openDropdown]} dropdown content...
              </div>
            )
          )}
        </DropdownPanel>
        <ContentBlock ref={contentBlockRef} style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0, position: 'relative', overflow: 'visible' }}>
          {/* Info block is now in normal flow, so tabs and images are always below */}
          {selectedCategory && categoryInfo && (
            <div style={{ background: 'transparent', padding: '32px 32px 0 32px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <animated.div style={{ fontWeight: 700, fontSize: 22, ...titleSpring }}>{categoryInfo.name}</animated.div>
                <animated.div style={{ fontWeight: 500, fontSize: 18, color: '#2563eb', ...upvotesSpring }}>{categoryUpvotes !== null ? `${formatUpvotes(categoryUpvotes)} Vootes` : ''}</animated.div>
              </div>
              <animated.div style={{ fontSize: 15, color: '#444', margin: '8px 0 0 0', textAlign: 'left', ...descSpring }}>{categoryInfo.description}</animated.div>
            </div>
          )}
          <div style={{ zIndex: 1, width: '100%' }}>
            <TabHeaderRow ref={tabHeaderRowRef} style={{ marginBottom: 0 }}>
              {tabLabels.map((tab, idx) => (
                <div key={tab} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <TabHeader
                    ref={tabRefs[idx]}
                    active={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </TabHeader>
                </div>
              ))}
              {/* Animated blue underline, middle 70% of active tab */}
              <animated.div style={{
                position: 'absolute',
                bottom: 0,
                height: 3,
                background: '#2563eb',
                borderRadius: 2,
                left: underlineSpring.left.to((l) => l + (underlineSpring.width.get() * 0.15)),
                width: underlineSpring.width.to((w) => w * 0.7),
                zIndex: 2
              }} />
            </TabHeaderRow>
          </div>
          <div style={{ padding: 32, flex: 1 }}>
            {activeTab === 'UpVote' && selectedCategory && (
              <animated.div style={imagesSpring}>
                <UpvoteImagesRow style={{ alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative', width: '100%', height: 280, marginTop: 56 }}>
                  <animated.div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 180, maxWidth: 220, wordBreak: 'break-word', position: 'relative', zIndex: 2, transform: shake1.rotate.to(r => `rotate(${r}deg)`), marginRight: 36 }}>
                    <animated.div style={{ opacity: fadeInIdx === 0 ? fadeInSpring.opacity : 1 }}>
                      <animated.div style={{ scale: imgPulse0.scale }}>
                        <ImagePlaceholder style={{ cursor: gameLoading || !currentPair[0] ? 'default' : 'pointer', opacity: currentPair[0] ? 1 : 0.3, position: 'relative', zIndex: 1, overflow: 'hidden', border: '1.5px solid #222', width: 240, height: 280 }} onClick={() => !gameLoading && currentPair[0] && handleVote(0)}>
                          {currentPair[0]?.imageUrl && (
                            <img src={currentPair[0].imageUrl} alt={currentPair[0]?.name || 'item'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, display: 'block' }} />
                          )}
                          <animated.div style={{
                            position: 'absolute',
                            top: 0, left: 0, width: 240, height: 280,
                            borderRadius: 16,
                            border: `4px solid ${NEON_GREEN}`,
                            background: 'transparent',
                            pointerEvents: 'none',
                            zIndex: 10,
                            opacity: borderSpring0.borderOpacity,
                            boxSizing: 'border-box',
                            transition: 'opacity 0.3s',
                          }} />
                        </ImagePlaceholder>
                      </animated.div>
                    </animated.div>
                    <div style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
                      <animated.div style={{ opacity: fadeInIdx === 0 ? fadeInSpring.opacity : 1, width: '100%' }}>
                        <ItemName style={{ wordBreak: 'break-word', marginTop: 0, whiteSpace: 'normal', overflowWrap: 'break-word', width: '100%', textAlign: 'center' }}>{currentPair[0]?.name || `Item 1`}</ItemName>
                      </animated.div>
                      <animated.div style={{ opacity: fadeInIdx === 0 ? fadeInSpring.opacity : 1, marginTop: 2, width: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, color: '#888', textAlign: 'center' }}>{currentPair[0]?.indexScore ?? ''}</div>
                      </animated.div>
                    </div>
                    {/* Lock In as #1 button logic for left item */}
                    <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, width: 240 }}>
                      {currentPair[0] && (
                        (lastWinnerId === currentPair[0].id && winnerStreak >= 3) ||
                        (top5Ids.includes(currentPair[0].id) && lastWinnerId === currentPair[0].id && winnerStreak >= 1)
                      ) && (
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                          padding: 0,
                          minHeight: 24,
                          minWidth: 0,
                          lineHeight: 1.2,
                          textDecoration: 'underline',
                        }} onClick={() => handleLockInAs1(0)}>Lock In as #1</button>
                      )}
                    </div>
                    {lockInReady && (
                      <button style={{ marginTop: 12, padding: '6px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', width: 240 }} onClick={() => handleLockInAs1(0)} disabled={gameLoading}>Lock In</button>
                    )}
                  </animated.div>
                  <div style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)', minWidth: 120, maxWidth: 140, minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3 }}>
                    <OrText style={{ margin: 0, padding: 0, minWidth: 0, textAlign: 'center', wordBreak: 'break-word' }}>OR</OrText>
                  </div>
                  <animated.div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', minWidth: 180, maxWidth: 220, wordBreak: 'break-word', position: 'relative', zIndex: 2, transform: shake2.rotate.to(r => `rotate(${r}deg)`), marginLeft: 36 }}>
                    <animated.div style={{ opacity: fadeInIdx === 1 ? fadeInSpring.opacity : 1 }}>
                      <animated.div style={{ scale: imgPulse1.scale }}>
                        <ImagePlaceholder style={{ cursor: gameLoading || !currentPair[1] ? 'default' : 'pointer', opacity: currentPair[1] ? 1 : 0.3, position: 'relative', zIndex: 1, overflow: 'hidden', border: '1.5px solid #222', width: 240, height: 280 }} onClick={() => !gameLoading && currentPair[1] && handleVote(1)}>
                          {currentPair[1]?.imageUrl && (
                            <img src={currentPair[1].imageUrl} alt={currentPair[1]?.name || 'item'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, display: 'block' }} />
                          )}
                          <animated.div style={{
                            position: 'absolute',
                            top: 0, left: 0, width: 240, height: 280,
                            borderRadius: 16,
                            border: `4px solid ${NEON_GREEN}`,
                            background: 'transparent',
                            pointerEvents: 'none',
                            zIndex: 10,
                            opacity: borderSpring1.borderOpacity,
                            boxSizing: 'border-box',
                            transition: 'opacity 0.3s',
                          }} />
                        </ImagePlaceholder>
                      </animated.div>
                    </animated.div>
                    <div style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
                      <animated.div style={{ opacity: fadeInIdx === 1 ? fadeInSpring.opacity : 1, width: '100%' }}>
                        <ItemName style={{ wordBreak: 'break-word', marginTop: 0, whiteSpace: 'normal', overflowWrap: 'break-word', width: '100%', textAlign: 'center' }}>{currentPair[1]?.name || `Item 2`}</ItemName>
                      </animated.div>
                      <animated.div style={{ opacity: fadeInIdx === 1 ? fadeInSpring.opacity : 1, marginTop: 2, width: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, color: '#888', textAlign: 'center' }}>{currentPair[1]?.indexScore ?? ''}</div>
                      </animated.div>
                    </div>
                    {/* Lock In as #1 button logic for right item */}
                    <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, width: 240 }}>
                      {currentPair[1] && (
                        (lastWinnerId === currentPair[1].id && winnerStreak >= 3) ||
                        (top5Ids.includes(currentPair[1].id) && lastWinnerId === currentPair[1].id && winnerStreak >= 1)
                      ) && (
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                          padding: 0,
                          minHeight: 24,
                          minWidth: 0,
                          lineHeight: 1.2,
                          textDecoration: 'underline',
                        }} onClick={() => handleLockInAs1(1)}>Lock In as #1</button>
                      )}
                    </div>
                  </animated.div>
                </UpvoteImagesRow>
                {gameLoading && <div style={{ textAlign: 'center', color: '#888', marginTop: 16 }}>Loading...</div>}
              </animated.div>
            )}
            {activeTab === 'Results' && selectedCategory && (
              <animated.div style={{ opacity: resultsParentSpring.opacity }}>
                {rankPage > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
                    <button
                      style={{
                        background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 2, textDecoration: 'underline',
                      }}
                      onClick={() => setRankPage(0)}
                    >Back to Top</button>
                    <FiChevronUp
                      style={{ fontSize: 32, color: '#2563eb', cursor: 'pointer', marginBottom: 2 }}
                      onClick={() => setRankPage(p => Math.max(0, p - 1))}
                    />
                  </div>
                )}
                <RankList>
                  {visibleRankItems.map((item, idx) => (
                    <div key={item.id || item.name || idx} style={{ opacity: 1 }}>
                      <RankItem>
                        <RankNum>{rankPage * 10 + idx + 1}.</RankNum>
                        <RankName>{item.name}</RankName>
                        <RankScore>{item.indexScore ?? 0}</RankScore>
                      </RankItem>
                    </div>
                  ))}
                  {rankItems.length > (rankPage + 1) * 10 && (
                    <DownArrow onClick={() => setRankPage(rankPage + 1)}>
                      <FiChevronDown />
                    </DownArrow>
                  )}
                </RankList>
              </animated.div>
            )}
            {activeTab === 'List' && selectedCategory && (
              <></>
            )}
          </div>
        </ContentBlock>
      </CenteredBarWrapper>
      <AdminPanel />
    </Container>
  );
}

export default App

