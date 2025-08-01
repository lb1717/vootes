import styled from 'styled-components'
import './App.css'
import { FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import AdminPanel from './AdminPanel'
import BulkUploadForm from './BulkUploadForm'
import { fetchCategories, fetchCategoryById, fetchCategoryUpvotes, fetchItemsForCategory } from './dbUtils'
import { useSpring, animated, useSprings, config } from '@react-spring/web';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAnalytics } from './hooks/useAnalytics';
import { visitedCountries } from './visitedCountries';
import WorldMap from 'react-svg-worldmap';
import WaveEffect from "./WaveEffect";

const BABY_BLUE = '#b3d8fd';
const NEON_BABY_BLUE = '#4fd1ff';
const GREY_BABY_BLUE = '#b3c7d8';
const BAR_WIDTH_NUM = 620;
const BAR_HEIGHT_NUM = 48;
const BORDER_RADIUS = 16;
const DARKER_BLUE = '#2563eb';
const NEON_GREEN = '#4be04b'; // Slightly lighter green

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
  
  /* Responsive scaling for screens smaller than 620px */
  @media (max-width: 619px) {
    transform: scale(calc(610 / 620));
    transform-origin: top center;
    width: 620px;
    max-width: 620px;
  }
`;

const AnimatedTitleWrapper = styled.div`
  margin-top: -10px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  box-sizing: border-box;
`;

const ResponsiveTitle = styled.div`
  text-align: center;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-weight: 800;
  font-size: 6.0rem;
  letter-spacing: -2px;
  color: ${DARKER_BLUE};
  margin-bottom: 4px;
  position: relative;
  
  @media (max-width: 768px) {
    font-size: 4.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 3.5rem;
  }
`;

const ResponsiveSubtitle = styled.div`
  text-align: center;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-weight: 400;
  font-size: 1.2rem;
  color: #666666;
  margin-top: -24px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.0rem;
  }
`;

const SearchWrapper = styled.div`
  margin-top: 28px;
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 20;
`;

const TotalVootesDisplay = styled.div`
  text-align: center;
  color:rgb(198, 20, 204);
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 9px;
  margin-bottom: -24px;
  font-family: inherit;
`;

const CenteredBarWrapper = styled.div`
  width: ${BAR_WIDTH_NUM}px;
  max-width: 100%;
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
  margin-top: 10px;
  width: 100%;
  display: flex;
  gap: 6px;
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
  box-sizing: border-box;
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
  height: 240px;
  background: #f3f4f6;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #888;
  box-shadow: 0 2px 8px rgba(34,34,59,0.06);
  position: relative;
  overflow: hidden;
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
  max-width: 520px;
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
  font-weight: ${props => props.rank <= 3 ? '900' : '700'};
  color: ${props => {
    if (props.rank === 1) return '#B8860B'; // Gold
    if (props.rank === 2) return '#C0C0C0'; // Silver
    if (props.rank === 3) return '#CD7F32'; // Bronze
    return '#2563eb'; // Default blue
  }};
  width: 2.2em;
  text-align: right;
  margin-right: 8px;
`;

const RankName = styled.span`
  flex: 1;
  margin-left: 8px;
  text-align: left;
  font-weight: 500;
  color: #22223b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
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
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: min-content;
  grid-auto-flow: row;
  gap: 2px 8px;
  padding: 8px;
  max-height: 400px;
  overflow-y: auto;
  width: 100%;
`;

const SportsButton = styled.div`
  width: 100%;
  padding: 2px 4px;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 2px;
  
  &:hover {
    color: #174ea6;
    background: #f0f4ff;
  }
`;

const ViewportWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
  
  /* Mobile viewport scaling */
  ${props => props.isMobile && `
    transform: scale(${props.scale});
    transform-origin: center top;
    width: 620px;
    max-width: 620px;
    min-height: 100vh;
    margin: 0 auto;
  `}
`;

function AnimatedUpVoteTitle({ logoRef }) {
  return (
    <AnimatedTitleWrapper ref={logoRef}>
      <div style={{
        textAlign: 'center',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontWeight: '800',
        fontSize: '6.0rem',
        letterSpacing: '-2px',
        color: DARKER_BLUE,
        marginBottom: '4px',
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          display: 'inline-block'
        }}>
          <span style={{
            position: 'relative',
            zIndex: 2
          }}>
            Vootes
          </span>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            color: BABY_BLUE,
            animation: 'colorShift 14s infinite',
            zIndex: 1
          }}>
            Vootes
          </div>
        </div>
      </div>
      <div style={{
        textAlign: 'center',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontWeight: '400',
        fontSize: '1.2rem',
        color: '#666666',
        marginTop: '-24px'
      }}>
        Every vote counts. Especially yours.
      </div>
      <style jsx>{`
        @keyframes colorShift {
          0%, 20% { opacity: 0; }
          25%, 45% { opacity: 1; }
          50%, 70% { opacity: 0; }
          75%, 95% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </AnimatedTitleWrapper>
  );
}

// Add this helper function near the top, after constants
function getNextChallenger(winner, allItems, usedItemIds = new Set()) {
  const minScore = (winner.indexScore || 0) * 0.95;
  const candidates = allItems.filter(
    it => it.id !== winner.id && 
         (it.indexScore || 0) >= minScore && 
         !usedItemIds.has(it.id)
  );
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  // fallback: any other item except winner and used items
  const others = allItems.filter(it => it.id !== winner.id && !usedItemIds.has(it.id));
  if (others.length > 0) {
    return others[Math.floor(Math.random() * others.length)];
  }
  // If all items have been used, return null to trigger a reset
  return null;
}

function App() {
  const categories = [
    'Sports',
    'Food',
    'Entertainment',
    'Brands',
    'Other',
  ];
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('Vote');
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

  // Viewport locking system
  const [viewportScale, setViewportScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate viewport scaling on mount and resize only
  useEffect(() => {
    const calculateViewport = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Base content width is 620px
      const baseContentWidth = 620;
      
      if (windowWidth <= 619) {
        // Calculate scale to fit content width with 5px safe space on each side
        const availableWidth = windowWidth - 10; // 5px safe space on each side
        const scale = Math.min(availableWidth / baseContentWidth, 1);
        setViewportScale(scale);
        setIsMobile(true);
      } else {
        setViewportScale(1);
        setIsMobile(false);
      }
    };

    calculateViewport();
    window.addEventListener('resize', calculateViewport);
    return () => window.removeEventListener('resize', calculateViewport);
  }, []);

  // Trending Questions state
  const [trendingMode, setTrendingMode] = useState(false);
  const [trendingQuestions, setTrendingQuestions] = useState([]); // [{category, items: [a, b]}]
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [trendingCompleted, setTrendingCompleted] = useState(false);
  const [trendingReady, setTrendingReady] = useState(false);

  // Track which item was voted for (for border styling)
  const [votedItemIdx, setVotedItemIdx] = useState(null);

  // Total Vootes state
  const [totalVootes, setTotalVootes] = useState(0);
  const [animatedVootes, setAnimatedVootes] = useState(0);

  // Game mode state
  const [ladderMode, setLadderMode] = useState(false); // true = Ladder, false = Random
  const [randomModeVoteCount, setRandomModeVoteCount] = useState(0); // Track votes in random mode

  // SVG border animation values
  const borderLength = 2 * (BAR_WIDTH_NUM + BAR_HEIGHT_NUM - 2 * BORDER_RADIUS) + 2 * Math.PI * BORDER_RADIUS;

  // Load all categories on mount
  useEffect(() => {
    fetchCategories('').then(results => {
      setAllCategories(results);
      setSearchResults(results);
      // Fetch total Vootes after categories are loaded
      fetchTotalVootes();
    });
  }, []);

  // Function to fetch total Vootes from all categories
  const fetchTotalVootes = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      let total = 0;
      let categoryCount = 0;
      categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.upvotes) {
          total += data.upvotes;
          categoryCount++;
          console.log(`Category ${data.name}: ${data.upvotes} upvotes`);
        }
      });
      console.log(`Total Vootes: ${total} from ${categoryCount} categories`);
      setTotalVootes(total);
    } catch (error) {
      console.error('Error fetching total Vootes:', error);
    }
  };

  // Only run the count-up animation once per page load
  const [initialVootesAnimated, setInitialVootesAnimated] = useState(false);
  useEffect(() => {
    if (totalVootes > 0 && trendingReady && !initialVootesAnimated) {
      const duration = 2500; // 2.5 seconds
      setAnimatedVootes(0);
      let start = null;
      let frameId;
      function animateCountUp(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(progress * totalVootes);
        setAnimatedVootes(value);
        if (progress < 1) {
          frameId = requestAnimationFrame(animateCountUp);
        } else {
          setAnimatedVootes(totalVootes);
          setInitialVootesAnimated(true);
        }
      }
      frameId = requestAnimationFrame(animateCountUp);
      return () => cancelAnimationFrame(frameId);
    } else if (totalVootes > 0 && !trendingReady && !initialVootesAnimated) {
      setAnimatedVootes(0);
    } else if (initialVootesAnimated) {
      setAnimatedVootes(totalVootes);
    }
  }, [totalVootes, trendingReady, initialVootesAnimated]);

  // Live update: after initial animation, only update animatedVootes if totalVootes increases by 1
  useEffect(() => {
    if (initialVootesAnimated && animatedVootes !== totalVootes) {
      // Only increment by 1 for live votes
      if (totalVootes === animatedVootes + 1) {
        setAnimatedVootes(totalVootes);
      }
      // If for some reason totalVootes jumps (e.g. admin update), just sync
      else if (totalVootes > animatedVootes) {
        setAnimatedVootes(totalVootes);
      }
    }
  }, [totalVootes, initialVootesAnimated]);

  // Function to get random category and its top 2 items
  const getRandomTrendingCategory = async (excludeIds = []) => {
    if (allCategories.length === 0) return null;
    // Exclude categories already used
    const available = allCategories.filter(cat => !excludeIds.includes(cat.id));
    if (available.length === 0) return null;
    const randomCategory = available[Math.floor(Math.random() * available.length)];
    try {
      const items = await fetchItemsForCategory(randomCategory.id);
      const sorted = [...items].sort((a, b) => (b.indexScore || 0) - (a.indexScore || 0));
      const topItems = sorted.slice(0, 2);
      return {
        category: randomCategory,
        items: topItems
      };
    } catch (error) {
      console.error('Error fetching trending items:', error);
      return null;
    }
  };

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
    transform: (selectedCategory || trendingMode) ? 'translateY(112px)' : 'translateY(0px)',
    config: { duration: TABS_ANIMATION_DURATION },
  });

  // Info block fades in after tabs move down
  const infoSpring = useSpring({
    opacity: (selectedCategory || trendingMode) ? 1 : 0,
    transform: (selectedCategory || trendingMode) ? 'translateY(0px)' : 'translateY(-24px)',
    config: { duration: INFO_ANIMATION_DURATION },
    delay: (selectedCategory || trendingMode) ? TABS_ANIMATION_DURATION : 0,
  });

  // Shake animation for each image
  const [shake1, setShake1] = useSpring(() => ({ rotate: 0 }));
  const [shake2, setShake2] = useSpring(() => ({ rotate: 0 }));

  const imagesSpring = useSpring({
    opacity: (selectedCategory || trendingMode) ? 1 : 0,
    filter: (selectedCategory || trendingMode) ? 'blur(0px)' : 'blur(4px)',
    config: { duration: IMAGES_ANIMATION_DURATION },
    delay: (selectedCategory || trendingMode) ? TABS_ANIMATION_DURATION : 0,
  });

  // Animated sliding underline for tabs
  const tabLabels = ['Vote', 'Results'];
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
    opacity: (selectedCategory || trendingMode) ? 1 : 0,
    clipPath: (selectedCategory || trendingMode) ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
    config: { duration: TITLE_ANIMATION_DURATION },
    delay: (selectedCategory || trendingMode) ? TABS_ANIMATION_DURATION : 0,
  });

  const upvotesSpring = useSpring({
    opacity: (selectedCategory || trendingMode) ? 1 : 0,
    clipPath: (selectedCategory || trendingMode) ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
    config: { duration: TITLE_ANIMATION_DURATION },
    delay: (selectedCategory || trendingMode) ? TABS_ANIMATION_DURATION + 60 : 0,
  });

  const descSpring = useSpring({
    opacity: (selectedCategory || trendingMode) ? 1 : 0,
    clipPath: (selectedCategory || trendingMode) ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
    config: { duration: DESC_ANIMATION_DURATION },
    delay: (selectedCategory || trendingMode) ? DESC_ANIMATION_DELAY : 0,
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
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [currentWinnerId, setCurrentWinnerId] = useState(null);
  const [currentEloRange, setCurrentEloRange] = useState(0); // Track current ELO range being shown
  const [usedMatchups, setUsedMatchups] = useState(new Set()); // Track used matchups to avoid repetition
  const [usedItemIds, setUsedItemIds] = useState(new Set()); // Track used item IDs to prevent repetition in ladder mode

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

  // Fetch items for Vote game when category changes
  useEffect(() => {
    if (activeTab === 'Vote' && selectedCategory) {
      setGameLoading(true);
      fetchItemsForCategory(selectedCategory.id).then(items => {
        setGameItems(items);
        // Start with items from the lower ELO range, not necessarily the two lowest
        if (items.length >= 2) {
          const sorted = [...items].sort((a, b) => (a.indexScore || 0) - (b.indexScore || 0));
          // Pick from the bottom 25% of items to ensure lower ELO but add variety
          const bottomQuarter = Math.max(2, Math.ceil(sorted.length * 0.25));
          const lowerRange = sorted.slice(0, bottomQuarter);
          
          // Pick two random items from the lower range
          const idxs = [];
          while (idxs.length < 2 && lowerRange.length > 1) {
            const idx = Math.floor(Math.random() * lowerRange.length);
            if (!idxs.includes(idx)) idxs.push(idx);
          }
          
          const initialPair = [lowerRange[idxs[0]], lowerRange[idxs[1]]];
          setCurrentPair(initialPair);
          setCurrentEloRange(0); // Start at the bottom
          setUsedItemIds(new Set([initialPair[0].id, initialPair[1].id])); // Track initial items as used
          setUsedMatchups(new Set([`${initialPair[0].id}-${initialPair[1].id}`])); // Mark initial matchup as used
        } else {
          setCurrentPair([null, null]);
        }
        setLastWinnerId(null);
        setLockInReady(false);
        setGameLoading(false);
        setConsecutiveWins(0);
        setCurrentWinnerId(null);
        setRandomModeVoteCount(0); // Reset vote count for new category
      });
    } else {
      setGameItems([]);
      setCurrentPair([null, null]);
      setLastWinnerId(null);
      setLockInReady(false);
      setConsecutiveWins(0);
      setCurrentWinnerId(null);
      setCurrentEloRange(0);
      setUsedItemIds(new Set());
      setUsedMatchups(new Set());
      setRandomModeVoteCount(0); // Reset vote count
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
    // Check if we're in trending mode or regular mode
    const items = trendingMode ? trendingQuestions[trendingIndex]?.items : currentPair;
    if (!items[0] || !items[1]) return;
    
    // Set which item was voted for (for border styling)
    setVotedItemIdx(winnerIdx);
    
    const winner = items[winnerIdx];
    const loserIdx = 1 - winnerIdx;
    const loser = items[loserIdx];
    
    // Track analytics
    if (trendingMode) {
      trackTrendingVote(trendingQuestions[trendingIndex]?.category?.name || 'Unknown', winner.name, loser.name, trendingIndex);
    } else if (selectedCategory) {
      trackVote(selectedCategory.name, winner.name, winner.name, loser.name);
    }
    
    // Track consecutive wins for regular mode
    if (!trendingMode) {
      if (currentWinnerId === winner.id) {
        setConsecutiveWins(prev => prev + 1);
        if (consecutiveWins + 1 >= 5) {
          setLockInReady(true);
        }
      } else {
        setConsecutiveWins(1);
        setCurrentWinnerId(winner.id);
        setLockInReady(false);
      }
      
      // Track votes in random mode
      if (!ladderMode) {
        setRandomModeVoteCount(prev => {
          const newCount = prev + 1;
          // Switch to Results tab after 12 votes
          if (newCount >= 12) {
            setTimeout(() => {
              setActiveTab('Results');
            }, 500); // Small delay to let the vote animation complete
          }
          return newCount;
        });
      }
    }
    
    setDisappearingIdx(loserIdx);
    (loserIdx === 0 ? disappearApi0 : disappearApi1).start({ opacity: 0, config: { duration: 220 } });

    setTimeout(() => {
      if (trendingMode) {
        (loserIdx === 0 ? disappearApi0 : disappearApi1).set({ opacity: 1 });
        setDisappearingIdx(null);
        const winner = trendingQuestions[trendingIndex]?.items[winnerIdx];
        const loser = trendingQuestions[trendingIndex]?.items[loserIdx];
        const { winner: updatedWinner, loser: updatedLoser } = updateElo(winner, loser);
        updateDoc(doc(db, 'categories', trendingQuestions[trendingIndex]?.category?.id, 'items', updatedWinner.id), { indexScore: updatedWinner.indexScore });
        updateDoc(doc(db, 'categories', trendingQuestions[trendingIndex]?.category?.id, 'items', updatedLoser.id), { indexScore: updatedLoser.indexScore });
        updateDoc(doc(db, 'categories', trendingQuestions[trendingIndex]?.category?.id), { upvotes: increment(1) });
        setTotalVootes(prev => prev + 1);
        setAnimatedVootes(prev => prev + 1);
        setTimeout(() => fetchTotalVootes(), 100);
        if (trendingIndex >= 4) {
          setTrendingMode(false);
          setTrendingCompleted(true);
          setTrendingQuestions([]);
          setTrendingIndex(0);
          return;
        } else {
          setTrendingIndex(idx => idx + 1);
          return;
        }
      }
      // LADDER MODE (default)
      if (ladderMode) {
        let usedFallback = false;
        let nextPair = winnerIdx === 0 ? nextPairIfLeftWins : nextPairIfRightWins;
        let imagesReady = winnerIdx === 0 ? nextPairImagesLoaded.left : nextPairImagesLoaded.right;
        if (nextPair && nextPair[0] && nextPair[1] && imagesReady) {
          setCurrentPair(nextPair);
          // Track used items for the new pair
          setUsedItemIds(prev => new Set([...prev, nextPair[0].id, nextPair[1].id]));
          setUsedMatchups(prev => new Set([...prev, `${nextPair[0].id}-${nextPair[1].id}`]));
          setFadeInIdx(loserIdx);
          setTimeout(() => setFadeInIdx(null), 300);
          setVotedItemIdx(null);
          setDisappearingIdx(null);
        } else {
          // fallback: recompute as before if not ready or if all items used
          usedFallback = true;
          const winner = currentPair[winnerIdx];
          const loser = currentPair[1 - winnerIdx];
          const { winner: updatedWinner, loser: updatedLoser } = updateElo(winner, loser);
          let updatedGameItems = gameItems.map(it => {
            if (it.id === updatedWinner.id) return { ...it, indexScore: updatedWinner.indexScore };
            if (it.id === updatedLoser.id) return { ...it, indexScore: updatedLoser.indexScore };
            return it;
          });
          const winnerItem = updatedGameItems.find(it => it.id === updatedWinner.id);
          const challenger = getNextChallenger(winnerItem, updatedGameItems, usedItemIds);
          if (challenger) {
            if (winnerIdx === 0) {
              setCurrentPair([winnerItem, challenger]);
            } else {
              setCurrentPair([challenger, winnerItem]);
            }
            // Track used items
            setUsedItemIds(prev => new Set([...prev, winnerItem.id, challenger.id]));
            setUsedMatchups(prev => new Set([...prev, `${winnerItem.id}-${challenger.id}`]));
          } else {
            // All items have been used, reset and start fresh
            const sorted = [...updatedGameItems].sort((a, b) => (a.indexScore || 0) - (b.indexScore || 0));
            const bottomQuarter = Math.max(2, Math.ceil(sorted.length * 0.25));
            const lowerRange = sorted.slice(0, bottomQuarter);
            
            const idxs = [];
            while (idxs.length < 2 && lowerRange.length > 1) {
              const idx = Math.floor(Math.random() * lowerRange.length);
              if (!idxs.includes(idx)) idxs.push(idx);
            }
            
            const newPair = [lowerRange[idxs[0]], lowerRange[idxs[1]]];
            setCurrentPair(newPair);
            setUsedItemIds(new Set([newPair[0].id, newPair[1].id]));
            setUsedMatchups(new Set([`${newPair[0].id}-${newPair[1].id}`]));
          }
          setFadeInIdx(loserIdx);
          setTimeout(() => setFadeInIdx(null), 300);
          setVotedItemIdx(null);
          setDisappearingIdx(null);
        }
        // Always update gameItems and Firestore regardless of which path
        const winner2 = currentPair[winnerIdx];
        const loser2 = currentPair[1 - winnerIdx];
        const { winner: updatedWinner2, loser: updatedLoser2 } = updateElo(winner2, loser2);
        let updatedGameItems2 = gameItems.map(it => {
          if (it.id === updatedWinner2.id) return { ...it, indexScore: updatedWinner2.indexScore };
          if (it.id === updatedLoser2.id) return { ...it, indexScore: updatedLoser2.indexScore };
          return it;
        });
        setGameItems(updatedGameItems2);
        updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedWinner2.id), { indexScore: updatedWinner2.indexScore });
        updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedLoser2.id), { indexScore: updatedLoser2.indexScore });
        if (selectedCategory) {
          setCategoryUpvotes(u => (u || 0) + 1);
          updateDoc(doc(db, 'categories', selectedCategory.id), { upvotes: increment(1) });
          setTotalVootes(prev => prev + 1);
          setAnimatedVootes(prev => prev + 1);
          setTimeout(() => fetchTotalVootes(), 100);
        }
      } else {
        // RANDOM MODE: use preloaded random items if available
        if (nextRandomItems.length >= 2) {
          setTimeout(() => {
            setRandomPairLoading(true);
            Promise.all([
              preloadImage(nextRandomItems[0].imageUrl),
              preloadImage(nextRandomItems[1].imageUrl)
            ]).then(() => {
              setCurrentPair([nextRandomItems[0], nextRandomItems[1]]);
              setRandomPairLoading(false);
            });
          }, 100);
          // Clear the used items so new ones will be generated
          setNextRandomItems([]);
        } else {
          // Fallback: pick two completely random, different items from gameItems
          if (gameItems.length >= 2) {
            let idxA = Math.floor(Math.random() * gameItems.length);
            let idxB;
            do {
              idxB = Math.floor(Math.random() * gameItems.length);
            } while (idxB === idxA && gameItems.length > 1);
            setTimeout(() => {
              setRandomPairLoading(true);
              Promise.all([
                preloadImage(gameItems[idxA].imageUrl),
                preloadImage(gameItems[idxB].imageUrl)
              ]).then(() => {
                setCurrentPair([gameItems[idxA], gameItems[idxB]]);
                setRandomPairLoading(false);
              });
            }, 100);
          }
        }
        // Still update ELO and upvotes for the picked pair
        const winner2 = currentPair[winnerIdx];
        const loser2 = currentPair[1 - winnerIdx];
        const { winner: updatedWinner2, loser: updatedLoser2 } = updateElo(winner2, loser2);
        let updatedGameItems2 = gameItems.map(it => {
          if (it.id === updatedWinner2.id) return { ...it, indexScore: updatedWinner2.indexScore };
          if (it.id === updatedLoser2.id) return { ...it, indexScore: updatedLoser2.indexScore };
          return it;
        });
        setGameItems(updatedGameItems2);
        updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedWinner2.id), { indexScore: updatedWinner2.indexScore });
        updateDoc(doc(db, 'categories', selectedCategory.id, 'items', updatedLoser2.id), { indexScore: updatedLoser2.indexScore });
        if (selectedCategory) {
          setCategoryUpvotes(u => (u || 0) + 1);
          updateDoc(doc(db, 'categories', selectedCategory.id), { upvotes: increment(1) });
          setTotalVootes(prev => prev + 1);
          setAnimatedVootes(prev => prev + 1);
          setTimeout(() => fetchTotalVootes(), 100);
        }
        setFadeInIdx(null);
        setVotedItemIdx(null);
        setDisappearingIdx(null);
      }
    }, 240);
  }

  // Handle Lock In as #1 button click
  async function handleLockInAs1(idx) {
    if (!currentPair[idx] || !currentPair[1-idx]) return;
    const winner = currentPair[idx];
    
    // Switch to Results tab immediately after lock-in
    setActiveTab('Results');
    
    // Track lock-in analytics
    if (selectedCategory) {
      trackLockIn(selectedCategory.name, winner.name);
    }
    
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
      if (it.id === updatedLoser.id) return { ...it, indexScore: updatedLoser.score };
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
    const newPair = [newLowerHalf[idxs[0]], newLowerHalf[idxs[1]]];
    setCurrentPair(newPair);
    setLastWinnerId(null);
    setLockInReady(false);
    setWinnerStreak(1);
    setConsecutiveWins(0);
    setCurrentWinnerId(null);
    // Reset used items when something is locked in as #1
    setUsedItemIds(new Set([newPair[0].id, newPair[1].id]));
    setUsedMatchups(new Set([`${newPair[0].id}-${newPair[1].id}`]));
  }

  // Handle Lock In Your #1 button click
  async function handleLockInYour1() {
    if (!currentWinnerId) return;
    
    // Switch to Results tab immediately after lock-in
    setActiveTab('Results');
    
    // Track lock-in analytics
    if (selectedCategory) {
      const winnerItem = gameItems.find(item => item.id === currentWinnerId);
      if (winnerItem) {
        trackLockIn(selectedCategory.name, winnerItem.name);
      }
    }
    
    // Pick two new random items from the lower half of the scale
    const sorted = [...gameItems].sort((a, b) => (a.indexScore || 0) - (b.indexScore || 0));
    const lowerHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    
    if (lowerHalf.length >= 2) {
      const idxs = [];
      while (idxs.length < 2 && lowerHalf.length > 1) {
        const i = Math.floor(Math.random() * lowerHalf.length);
        if (!idxs.includes(i)) idxs.push(i);
      }
      const newPair = [lowerHalf[idxs[0]], lowerHalf[idxs[1]]];
      setCurrentPair(newPair);
      // Reset used items when something is locked in as #1
      setUsedItemIds(new Set([newPair[0].id, newPair[1].id]));
      setUsedMatchups(new Set([`${newPair[0].id}-${newPair[1].id}`]));
    } else if (lowerHalf.length === 1) {
      // If only one item in lower half, pick another random item
      const otherItems = gameItems.filter(it => it.id !== lowerHalf[0].id);
      if (otherItems.length > 0) {
        const randomItem = otherItems[Math.floor(Math.random() * otherItems.length)];
        const newPair = [lowerHalf[0], randomItem];
        setCurrentPair(newPair);
        // Reset used items when something is locked in as #1
        setUsedItemIds(new Set([newPair[0].id, newPair[1].id]));
        setUsedMatchups(new Set([`${newPair[0].id}-${newPair[1].id}`]));
      }
    }
    
    // Reset states
    setLastWinnerId(null);
    setLockInReady(false);
    setConsecutiveWins(0);
    setCurrentWinnerId(null);
    // Reset used items when something is locked in as #1
    // Note: newPair is defined in the if/else blocks above, so we need to handle this differently
    // The used items will be reset when the next pair is set in the if/else blocks above
  }

  // Format upvotes (e.g. 1,234, 1,234,567)
  function formatUpvotes(num) {
    return num.toLocaleString();
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

  // Analytics hook
  const { trackVote, trackCategorySelect, trackTrendingVote, trackLockIn } = useAnalytics();

  useEffect(() => {
    const scrollToHalfRight = () => {
      const maxScroll = document.documentElement.scrollWidth - window.innerWidth;
      window.scrollTo({ left: maxScroll / 2, behavior: 'auto' });
    };
    // Scroll on load
    scrollToHalfRight();
    // Also scroll when page becomes visible
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        scrollToHalfRight();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Add with other useState
  const [nextPairIfLeftWins, setNextPairIfLeftWins] = useState(null);
  const [nextPairIfRightWins, setNextPairIfRightWins] = useState(null);
  const [nextPairImagesLoaded, setNextPairImagesLoaded] = useState({ left: false, right: false });

  // Simple preloading for random mode
  const [nextRandomItems, setNextRandomItems] = useState([]);

  // Utility to preload an image and return a promise
  function preloadImage(url) {
    return new Promise((resolve) => {
      if (!url) return resolve();
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  // Precompute and preload both possible next pairs
  useEffect(() => {
    if (!currentPair[0] || !currentPair[1] || !gameItems.length) return;
    // Compute next pairs for both outcomes
    const computeNextPair = (winnerIdx) => {
      const winner = currentPair[winnerIdx];
      const loser = currentPair[1 - winnerIdx];
      const { winner: updatedWinner, loser: updatedLoser } = updateElo(winner, loser);
      let updatedGameItems = gameItems.map(it => {
        if (it.id === updatedWinner.id) return { ...it, indexScore: updatedWinner.indexScore };
        if (it.id === updatedLoser.id) return { ...it, indexScore: updatedLoser.indexScore };
        return it;
      });
      const winnerItem = updatedGameItems.find(it => it.id === updatedWinner.id);
      const challenger = getNextChallenger(winnerItem, updatedGameItems, usedItemIds);
      if (challenger) {
        if (winnerIdx === 0) {
          return [winnerItem, challenger];
        } else {
          return [challenger, winnerItem];
        }
      } else {
        // All items have been used, return null to trigger reset
        return null;
      }
    };
    const leftPair = computeNextPair(0);
    const rightPair = computeNextPair(1);
    setNextPairIfLeftWins(leftPair);
    setNextPairIfRightWins(rightPair);
    // Preload images for both pairs
    setNextPairImagesLoaded({ left: false, right: false });
    if (leftPair && leftPair[0] && leftPair[1]) {
      Promise.all([
        preloadImage(leftPair[0].imageUrl),
        preloadImage(leftPair[1].imageUrl)
      ]).then(() => setNextPairImagesLoaded(prev => ({ ...prev, left: true })));
    }
    if (rightPair && rightPair[0] && rightPair[1]) {
      Promise.all([
        preloadImage(rightPair[0].imageUrl),
        preloadImage(rightPair[1].imageUrl)
      ]).then(() => setNextPairImagesLoaded(prev => ({ ...prev, right: true })));
    }
  }, [currentPair, gameItems, currentEloRange, usedItemIds]);

  // Simple preloading for random mode - generate next 2 random items
  useEffect(() => {
    if (!ladderMode && gameItems.length >= 2) {
      // Generate next 2 random items
      const items = [];
      for (let i = 0; i < 2; i++) {
        let idx = Math.floor(Math.random() * gameItems.length);
        while (items.some(item => item.id === gameItems[idx].id)) {
          idx = Math.floor(Math.random() * gameItems.length);
        }
        items.push(gameItems[idx]);
      }
      setNextRandomItems(items);
      
      // Preload their images
      Promise.all(items.map(item => preloadImage(item.imageUrl)));
    }
  }, [currentPair, gameItems, ladderMode]);

  // Preload all trending questions and images when trending mode starts
  useEffect(() => {
    let cancelled = false;
    if (trendingMode && trendingQuestions.length === 0 && allCategories.length > 0) {
      (async () => {
        const usedIds = [];
        // Fetch the first trending question
        const firstQ = await getRandomTrendingCategory(usedIds);
        if (!firstQ) return;
        usedIds.push(firstQ.category.id);
        // Preload images for the first question
        await Promise.all(firstQ.items.map(item => preloadImage(item?.imageUrl)));
        if (cancelled) return;
        setTrendingQuestions([firstQ]);
        setTrendingIndex(0);
        setTrendingReady(true);
        // Fetch the remaining 4 trending questions in the background
        (async () => {
          const restQs = await Promise.all(
            Array.from({ length: 4 }, async () => {
              const q = await getRandomTrendingCategory(usedIds);
              if (q) usedIds.push(q.category.id);
              return q;
            })
          );
          const moreQs = restQs.filter(Boolean);
          // Preload images for the rest
          moreQs.forEach(q => q.items.forEach(item => preloadImage(item?.imageUrl)));
          if (cancelled) return;
          setTrendingQuestions([firstQ, ...moreQs]);
        })();
      })();
    }
    if (!trendingMode) {
      setTrendingQuestions([]);
      setTrendingIndex(0);
      setTrendingReady(false);
    }
    return () => { cancelled = true; };
  }, [trendingMode, allCategories]);

  // Reset green border animation when trendingIndex changes
  useEffect(() => {
    if (trendingMode) {
      borderApi0.start({ borderOpacity: 0 });
      borderApi1.start({ borderOpacity: 0 });
      setVotedItemIdx(null);
    }
  }, [trendingIndex, trendingMode]);

  // Restore trendingMode auto-start logic (but do not set trendingQuestions or trendingIndex here)
  useEffect(() => {
    if (!selectedCategory && !trendingMode && !trendingCompleted && allCategories.length > 0) {
      setTrendingMode(true);
    }
  }, [selectedCategory, trendingMode, trendingCompleted, allCategories]);

  const WORLD_MAP_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

  const MapWrapper = styled.div`
    width: ${BAR_WIDTH_NUM}px;
    max-width: 100%;
    margin: 32px auto 0 auto;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 2px 16px rgba(34,34,59,0.04);
    padding: 24px 32px 16px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
  `;

  const MapTitle = styled.div`
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-weight: 800;
    font-size: 2.1rem;
    color: #2563eb;
    margin-bottom: 4px;
    text-align: center;
  `;

  const MapSubtitle = styled.div`
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-weight: 400;
    font-size: 1.05rem;
    color: #888;
    margin-bottom: 18px;
    text-align: center;
  `;

  const waveRef = useRef();

  // Add audio ref for jingle
  const jingleRef = useRef();

  function handleVoteWithWave(winnerIdx, event) {
    // Trigger green ripple instantly
    if (waveRef.current && event && event.clientX !== undefined && event.clientY !== undefined) {
      waveRef.current.triggerWave(event.clientX, event.clientY);
    }
    // Play jingle sound
    if (jingleRef.current) {
      jingleRef.current.currentTime = 0;
      jingleRef.current.play();
    }
    // (Removed: Vibrate on mobile)
    // (Removed: Pop animation)
    handleVote(winnerIdx);
  }

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const tripleTapRef = useRef({ count: 0, last: 0, timer: null });

  function handleTripleTap() {
    const now = Date.now();
    if (now - tripleTapRef.current.last < 600) {
      tripleTapRef.current.count += 1;
    } else {
      tripleTapRef.current.count = 1;
    }
    tripleTapRef.current.last = now;
    if (tripleTapRef.current.timer) clearTimeout(tripleTapRef.current.timer);
    tripleTapRef.current.timer = setTimeout(() => {
      tripleTapRef.current.count = 0;
    }, 600);
    if (tripleTapRef.current.count === 3) {
      setShowBulkUpload(v => !v);
      tripleTapRef.current.count = 0;
    }
  }

  // But since the 'volume' prop does not work on <audio>, set it in a useEffect:
  useEffect(() => {
    if (jingleRef.current) {
      jingleRef.current.volume = 0.2;
    }
  }, []);

  const [randomPairLoading, setRandomPairLoading] = useState(false);

  return (
    <>
      <audio ref={jingleRef} src="/jingle.mp3" preload="auto" volume={0.2} />
      <WaveEffect ref={waveRef} />
      <ViewportWrapper isMobile={isMobile} scale={viewportScale}>
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
                            // Track category selection
                            trackCategorySelect(cat.name);
                              // Exit trending mode when category is selected
                              setTrendingMode(false);
                              setTrendingIndex(0);
                              setTrendingQuestions([]);
                              setTrendingCompleted(false); // Reset completion status
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
                <SportsDropdownGrid>
                  {allCategories
                    .filter(cat => {
                      const dropdownType = categories[openDropdown];
                      // If category has a categoryType, filter by it
                      if (cat.categoryType) {
                        return cat.categoryType === dropdownType;
                      }
                      // Legacy categories without categoryType - use name-based filtering
                      if (dropdownType === 'Sports') {
                        return cat.name.includes('Football') || cat.name.includes('Basketball') || cat.name.includes('NBA');
                      } else if (dropdownType === 'Food') {
                        return cat.name.includes('Food') || cat.name.includes('Fast Food');
                      }
                      // For Entertainment, Brands, and Other - only show categories with proper categoryType
                      return false;
                    })
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(cat => (
                      <SportsButton
                        key={cat.id}
                      onClick={() => {
                          setSelectedCategory({ id: cat.id, name: cat.name });
                          setOpenDropdown(null);
                          // Track category selection
                          trackCategorySelect(cat.name);
                          // Exit trending mode when category is selected
                          setTrendingMode(false);
                          setTrendingIndex(0);
                          setTrendingQuestions([]);
                          setTrendingCompleted(false); // Reset completion status
                        }}
                      >
                        {cat.name}
                      </SportsButton>
                    ))}
                </SportsDropdownGrid>
            )}
          </DropdownPanel>
            <TotalVootesDisplay>
              All-Time Vootes<br />
              <span style={{ fontWeight: '900', fontSize: '1.3em', display: 'block', marginTop: -2 }}>{formatUpvotes(animatedVootes)}</span>
            </TotalVootesDisplay>
          <ContentBlock ref={contentBlockRef} style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0, position: 'relative', overflow: 'visible' }}>
            {/* Info block is now in normal flow, so tabs and images are always below */}
            {selectedCategory && categoryInfo && (
              <div style={{ background: 'transparent', padding: '32px 32px 0 32px', marginBottom: 8 }}>
                {/* First row: Title and Upvotes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                  <animated.div style={{ fontWeight: 700, fontSize: 22, ...titleSpring }}>{categoryInfo.name}</animated.div>
                  <animated.div style={{ fontWeight: 700, fontSize: 22, color: '#2563eb', ...upvotesSpring }}>{categoryUpvotes !== null ? `${formatUpvotes(categoryUpvotes)} Vootes` : ''}</animated.div>
                </div>
                {/* Second row: Description and Mode Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <animated.div style={{ fontSize: 15, color: '#444', textAlign: 'left', flex: 1, ...descSpring }}>{categoryInfo.description}</animated.div>
                  {/* Toggle for Ladder/Random mode */}
                  <div style={{
                    display: 'flex',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginLeft: 24,
                    alignSelf: 'flex-start',
                    height: 28,
                    outline: 'none',
                    boxShadow: 'none',
                  }}>
                    <button
                      onClick={() => setLadderMode(true)}
                      style={{
                        background: ladderMode ? '#22223b' : '#e5e7eb',
                        color: ladderMode ? '#fff' : '#22223b',
                        border: 'none',
                        outline: 'none',
                        fontWeight: 500,
                        fontSize: 13,
                        padding: '0 14px',
                        height: '100%',
                        cursor: ladderMode ? 'default' : 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                        boxShadow: 'none',
                      }}
                      disabled={ladderMode}
                      tabIndex={0}
                      onFocus={e => e.target.style.outline = 'none'}
                    >
                      Ladder
                    </button>
                    <button
                      onClick={() => setLadderMode(false)}
                      style={{
                        background: !ladderMode ? '#22223b' : '#e5e7eb',
                        color: !ladderMode ? '#fff' : '#22223b',
                        border: 'none',
                        outline: 'none',
                        fontWeight: 500,
                        fontSize: 13,
                        padding: '0 14px',
                        height: '100%',
                        cursor: !ladderMode ? 'default' : 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                        boxShadow: 'none',
                      }}
                      disabled={!ladderMode}
                      tabIndex={0}
                      onFocus={e => e.target.style.outline = 'none'}
                    >
                      Random
                    </button>
                  </div>
                </div>
              </div>
            )}
              {trendingMode && !selectedCategory && (!trendingReady || !trendingQuestions[0]) ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                  <div className="spinner" style={{ width: 48, height: 48, border: '6px solid #eee', borderTop: '6px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              ) : null}
              {trendingMode && !selectedCategory && trendingReady && trendingQuestions[0] && (
                <div style={{ background: 'transparent', padding: '32px 32px 0 32px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                    <animated.div style={{ fontWeight: 700, fontSize: 22, ...titleSpring }}>Trending Questions 📈</animated.div>
                    <animated.div style={{ fontWeight: 500, fontSize: 18, color: '#2563eb', ...upvotesSpring }}>{(trendingIndex + 1)}/5</animated.div>
                  </div>
                  <animated.div style={{ fontSize: 15, color: '#444', margin: '8px 0 0 0', textAlign: 'left', ...descSpring }}>{trendingQuestions[trendingIndex]?.category?.name}</animated.div>
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
                {activeTab === 'Vote' && selectedCategory && (
                <animated.div style={imagesSpring}>
                    {randomPairLoading ? (
                      <div style={{ width: '100%', height: 280, background: '#fff' }} />
                    ) : (
                      <UpvoteImagesRow style={{ alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative', width: '100%', height: 280, marginTop: 20 }}>
                        <animated.div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 180, maxWidth: 220, wordBreak: 'break-word', position: 'relative', zIndex: 2, transform: shake1.rotate.to(r => `rotate(${r}deg)`), marginRight: 36 }}>
                          <animated.div style={{ opacity: fadeInIdx === 0 ? fadeInSpring.opacity : 1 }}>
                            <animated.div style={{ scale: imgPulse0.scale }}>
                                <ImagePlaceholder style={{ cursor: gameLoading || !currentPair[0] ? 'default' : 'pointer', opacity: currentPair[0] ? 1 : 0.3, position: 'relative', zIndex: 1, overflow: 'hidden', border: votedItemIdx === 0 ? `1.5px solid ${NEON_GREEN}` : '1.5px solid #222', width: 240, height: 260, background: '#fff' }} onClick={(e) => !gameLoading && currentPair[0] && handleVoteWithWave(0, e)}>
                                {currentPair[0]?.imageUrl && (
                                    <img src={currentPair[0].imageUrl} alt={currentPair[0]?.name || 'item'} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, display: 'block', position: 'absolute', top: 0, left: 0, background: '#fff' }} />
                                )}
                                <animated.div style={{
                                  position: 'absolute',
                                    top: 0, left: 0, width: 240, height: 260,
                                  borderRadius: 16,
                                  border: `1.5px solid ${NEON_GREEN}`,
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
                            <div style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
                            <animated.div style={{ opacity: fadeInIdx === 0 ? fadeInSpring.opacity : 1, width: '100%' }}>
                                <animated.div style={{ scale: namePulse0.scale }}>
                              <ItemName style={{ wordBreak: 'break-word', marginTop: 0, whiteSpace: 'normal', overflowWrap: 'break-word', width: '100%', textAlign: 'center' }}>{currentPair[0]?.name || `Item 1`}</ItemName>
                            </animated.div>
                            </animated.div>
                              {lockInReady && currentWinnerId === currentPair[0]?.id && (
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                  <button style={{ padding: '6px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: 'auto', minWidth: 120 }} onClick={() => handleLockInYour1()} disabled={gameLoading}>Lock In Your #1</button>
                                </div>
                              )}
                          </div>
                          {/* Lock In as #1 button logic for left item (now requires 5 consecutive picks) */}
                          <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, width: 240 }}>
                            {currentPair[0] && (
                              (lastWinnerId === currentPair[0].id && winnerStreak >= 5) ||
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
                        </animated.div>
                        <div style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)', minWidth: 120, maxWidth: 140, minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3 }}>
                          <OrText style={{ margin: 0, padding: 0, minWidth: 0, textAlign: 'center', wordBreak: 'break-word' }}>OR</OrText>
                        </div>
                        <animated.div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', minWidth: 180, maxWidth: 220, wordBreak: 'break-word', position: 'relative', zIndex: 2, transform: shake2.rotate.to(r => `rotate(${r}deg)`), marginLeft: 36 }}>
                          <animated.div style={{ opacity: fadeInIdx === 1 ? fadeInSpring.opacity : 1 }}>
                            <animated.div style={{ scale: imgPulse1.scale }}>
                                <ImagePlaceholder style={{ cursor: gameLoading || !currentPair[1] ? 'default' : 'pointer', opacity: currentPair[1] ? 1 : 0.3, position: 'relative', zIndex: 1, overflow: 'hidden', border: votedItemIdx === 1 ? `1.5px solid ${NEON_GREEN}` : '1.5px solid #222', width: 240, height: 260, background: '#fff' }} onClick={(e) => !gameLoading && currentPair[1] && handleVoteWithWave(1, e)}>
                                {currentPair[1]?.imageUrl && (
                                    <img src={currentPair[1].imageUrl} alt={currentPair[1]?.name || 'item'} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, display: 'block', position: 'absolute', top: 0, left: 0, background: '#fff' }} />
                                )}
                                <animated.div style={{
                                  position: 'absolute',
                                    top: 0, left: 0, width: 240, height: 260,
                                  borderRadius: 16,
                                  border: `1.5px solid ${NEON_GREEN}`,
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
                            <div style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
                            <animated.div style={{ opacity: fadeInIdx === 1 ? fadeInSpring.opacity : 1, width: '100%' }}>
                                <animated.div style={{ scale: namePulse1.scale }}>
                              <ItemName style={{ wordBreak: 'break-word', marginTop: 0, whiteSpace: 'normal', overflowWrap: 'break-word', width: '100%', textAlign: 'center' }}>{currentPair[1]?.name || `Item 2`}</ItemName>
                            </animated.div>
                            </animated.div>
                              {lockInReady && currentWinnerId === currentPair[1]?.id && (
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                  <button style={{ padding: '6px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: 'auto', minWidth: 120 }} onClick={() => handleLockInYour1()} disabled={gameLoading}>Lock In Your #1</button>
                                </div>
                              )}
                          </div>
                          {/* Lock In as #1 button logic for right item (now requires 5 consecutive picks) */}
                          <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, width: 240 }}>
                            {currentPair[1] && (
                              (lastWinnerId === currentPair[1].id && winnerStreak >= 5) ||
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
                    )}
                  {gameLoading && <div style={{ textAlign: 'center', color: '#888', marginTop: 16 }}>Loading...</div>}
                </animated.div>
              )}
                {activeTab === 'Vote' && !selectedCategory && trendingMode && (
                  <animated.div style={imagesSpring}>
                    {randomPairLoading ? (
                      <div style={{ width: '100%', height: 280, background: '#fff' }} />
                    ) : (
                      <UpvoteImagesRow style={{ alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative', width: '100%', height: 280, marginTop: 20 }}>
                        <animated.div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 180, maxWidth: 220, wordBreak: 'break-word', position: 'relative', zIndex: 2, transform: shake1.rotate.to(r => `rotate(${r}deg)`), marginRight: 36 }}>
                          <animated.div style={{ opacity: fadeInIdx === 0 ? fadeInSpring.opacity : 1 }}>
                            <animated.div style={{ scale: imgPulse0.scale }}>
                              <ImagePlaceholder style={{ cursor: trendingQuestions[trendingIndex]?.items[0] ? 'pointer' : 'default', opacity: trendingQuestions[trendingIndex]?.items[0] ? 1 : 0.3, position: 'relative', zIndex: 1, overflow: 'hidden', border: votedItemIdx === 0 ? `1.5px solid ${NEON_GREEN}` : '1.5px solid #222', width: 240, height: 260, background: '#fff' }} onClick={(e) => trendingQuestions[trendingIndex]?.items[0] && handleVoteWithWave(0, e)}>
                                {trendingQuestions[trendingIndex]?.items[0]?.imageUrl && (
                                  <img src={trendingQuestions[trendingIndex]?.items[0].imageUrl} alt={trendingQuestions[trendingIndex]?.items[0]?.name || 'item'} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, display: 'block', position: 'absolute', top: 0, left: 0, background: '#fff' }} />
                                )}
                                <animated.div style={{
                                  position: 'absolute',
                                  top: 0, left: 0, width: 240, height: 260,
                                  borderRadius: 16,
                                  border: `1.5px solid ${NEON_GREEN}`,
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
                              <animated.div style={{ scale: namePulse0.scale }}>
                                <ItemName style={{ wordBreak: 'break-word', marginTop: 0, whiteSpace: 'normal', overflowWrap: 'break-word', width: '100%', textAlign: 'center' }}>{trendingQuestions[trendingIndex]?.items[0]?.name || `Item 1`}</ItemName>
                              </animated.div>
                            </animated.div>
                          </div>
                        </animated.div>
                        <div style={{ position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)', minWidth: 120, maxWidth: 140, minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3 }}>
                          <OrText style={{ margin: 0, padding: 0, minWidth: 0, textAlign: 'center', wordBreak: 'break-word' }}>OR</OrText>
                        </div>
                        <animated.div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', minWidth: 180, maxWidth: 220, wordBreak: 'break-word', position: 'relative', zIndex: 2, transform: shake2.rotate.to(r => `rotate(${r}deg)`), marginLeft: 36 }}>
                          <animated.div style={{ opacity: fadeInIdx === 1 ? fadeInSpring.opacity : 1 }}>
                            <animated.div style={{ scale: imgPulse1.scale }}>
                              <ImagePlaceholder style={{ cursor: trendingQuestions[trendingIndex]?.items[1] ? 'pointer' : 'default', opacity: trendingQuestions[trendingIndex]?.items[1] ? 1 : 0.3, position: 'relative', zIndex: 1, overflow: 'hidden', border: votedItemIdx === 1 ? `1.5px solid ${NEON_GREEN}` : '1.5px solid #222', width: 240, height: 260, background: '#fff' }} onClick={(e) => trendingQuestions[trendingIndex]?.items[1] && handleVoteWithWave(1, e)}>
                                {trendingQuestions[trendingIndex]?.items[1]?.imageUrl && (
                                  <img src={trendingQuestions[trendingIndex]?.items[1].imageUrl} alt={trendingQuestions[trendingIndex]?.items[1]?.name || 'item'} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, display: 'block', position: 'absolute', top: 0, left: 0, background: '#fff' }} />
                                )}
                                <animated.div style={{
                                  position: 'absolute',
                                  top: 0, left: 0, width: 240, height: 260,
                                  borderRadius: 16,
                                  border: `1.5px solid ${NEON_GREEN}`,
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
                              <animated.div style={{ scale: namePulse1.scale }}>
                                <ItemName style={{ wordBreak: 'break-word', marginTop: 0, whiteSpace: 'normal', overflowWrap: 'break-word', width: '100%', textAlign: 'center' }}>{trendingQuestions[trendingIndex]?.items[1]?.name || `Item 2`}</ItemName>
                              </animated.div>
                            </animated.div>
                          </div>
                        </animated.div>
                      </UpvoteImagesRow>
                    )}
                  </animated.div>
                )}
                {activeTab === 'Vote' && !selectedCategory && !trendingMode && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem', color: '#888' }}>
                    Select Category
                  </div>
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
                          <RankNum rank={rankPage * 10 + idx + 1}>{rankPage * 10 + idx + 1}.</RankNum>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              flex: 1,
                              marginLeft: '16px'
                            }}>
                              {item.imageUrl && (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  marginRight: '12px',
                                  flexShrink: 0,
                                  backgroundColor: '#f0f0f0'
                                }}>
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      display: 'block'
                                    }} 
                                  />
                                </div>
                              )}
                          <RankName>{item.name}</RankName>
                            </div>
                            <RankScore>{formatUpvotes(item.indexScore ?? 0)}</RankScore>
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
        {/* Vootes Worldwide Map */}
        <MapWrapper>
          <MapTitle>Vootes Worldwide</MapTitle>
          <MapSubtitle>Every country's Vootes count.</MapSubtitle>
          <WorldMap
            color={DARKER_BLUE}
            backgroundColor="#fff"
            size="lg"
            data={visitedCountries.map(code => ({ country: code.toLowerCase(), value: 1 }))}
            style={{ width: '100%', height: '220px', minHeight: 220 }}
            styleFunction={(countryContext) => {
              const isVisited = visitedCountries.map(c => c.toLowerCase()).includes(countryContext.countryCode.toLowerCase());
              return {
                fill: isVisited ? DARKER_BLUE : '#e0e4ea', // blue for visited, light grey for others
                stroke: '#A9A9A9',
                strokeWidth: 2,
              };
            }}
          />
        </MapWrapper>
        {/* Triple tap area under the map */}
        <div
          style={{ width: '100%', height: 60, cursor: 'pointer', background: 'transparent', marginBottom: 0 }}
          onClick={handleTripleTap}
        />
        {/* BulkUploadForm is only visible after triple tap */}
        {showBulkUpload && <BulkUploadForm />}
      </Container>
      </ViewportWrapper>
    </>
  );
}

export default App

