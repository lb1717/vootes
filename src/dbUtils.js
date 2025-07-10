import { db } from './firebase.js';
import { collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

// Add a new category
export const addCategory = async (name, description = '', categoryType = 'Other') => {
  const docRef = await addDoc(collection(db, 'categories'), { 
    name, 
    description, 
    categoryType 
  });
  return docRef.id;
};

// Add an item to a category
export const addItemToCategory = async (categoryId, item) => {
  const itemRef = doc(collection(db, 'categories', categoryId, 'items'));
  await setDoc(itemRef, {
    name: item.name,
    upvotes: 0,
    indexScore: 1000,
    picture: item.picture,
  });
};

// Fetch categories, optionally filtered by search string
export const fetchCategories = async (search = '') => {
  const cats = [];
  const q = collection(db, 'categories');
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!search || (data.name && data.name.toLowerCase().includes(search.toLowerCase()))) {
      cats.push({ id: docSnap.id, ...data });
    }
  });
  console.log('fetchCategories("' + search + '") returned:', cats);
  return cats;
};

// Fetch a single category by id
export const fetchCategoryById = async (categoryId) => {
  const catDoc = await getDocs(collection(db, 'categories'));
  for (const docSnap of catDoc.docs) {
    if (docSnap.id === categoryId) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  }
  return null;
};

// Fetch sum of upvotes for all items in a category
export const fetchCategoryUpvotes = async (categoryId) => {
  const itemsSnap = await getDocs(collection(db, 'categories', categoryId, 'items'));
  let total = 0;
  itemsSnap.forEach(doc => {
    const data = doc.data();
    if (typeof data.upvotes === 'number') total += data.upvotes;
  });
  return total;
};

// Fetch all items for a category
export const fetchItemsForCategory = async (categoryId) => {
  const items = [];
  const itemsSnap = await getDocs(collection(db, 'categories', categoryId, 'items'));
  itemsSnap.forEach(docSnap => {
    const data = docSnap.data();
    items.push({ id: docSnap.id, ...data, imageUrl: data.picture });
  });
  return items;
}; 