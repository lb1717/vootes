import { useCallback } from 'react';

// Custom hook for Google Analytics
export const useAnalytics = () => {
  const trackEvent = useCallback((eventName, parameters = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }, []);

  const trackPageView = useCallback((pageTitle, pageLocation) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-YV38LD1G2Q', {
        page_title: pageTitle,
        page_location: pageLocation,
      });
    }
  }, []);

  const trackVote = useCallback((categoryName, itemName, winnerName, loserName) => {
    trackEvent('vote', {
      event_category: 'Voting',
      event_label: `${categoryName} - ${winnerName} vs ${loserName}`,
      category_name: categoryName,
      winner: winnerName,
      loser: loserName,
      item_name: itemName
    });
  }, [trackEvent]);

  const trackCategorySelect = useCallback((categoryName) => {
    trackEvent('category_select', {
      event_category: 'Navigation',
      event_label: categoryName,
      category_name: categoryName
    });
  }, [trackEvent]);

  const trackTrendingVote = useCallback((categoryName, winnerName, loserName, round) => {
    trackEvent('trending_vote', {
      event_category: 'Trending',
      event_label: `${categoryName} - Round ${round}`,
      category_name: categoryName,
      winner: winnerName,
      loser: loserName,
      round: round
    });
  }, [trackEvent]);

  const trackLockIn = useCallback((categoryName, itemName) => {
    trackEvent('lock_in', {
      event_category: 'Game',
      event_label: `${categoryName} - ${itemName}`,
      category_name: categoryName,
      item_name: itemName
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackVote,
    trackCategorySelect,
    trackTrendingVote,
    trackLockIn
  };
}; 