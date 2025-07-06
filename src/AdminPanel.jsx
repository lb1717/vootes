import React, { useState, useEffect } from 'react';
import { addCategory, addItemToCategory } from './dbUtils';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

function AdminPanel() {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPic, setItemPic] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});

  const handleAddCategory = async () => {
    if (!categoryName) return alert('Enter a category name!');
    const id = await addCategory(categoryName, categoryDescription);
    setCategoryId(id);
    setCategoryName('');
    setCategoryDescription('');
    alert('Category added with ID: ' + id);
    fetchCategories();
  };

  const handleAddItem = async () => {
    if (!categoryId) {
      alert('Add a category first!');
      return;
    }
    if (!itemName || !itemPic) return alert('Enter item name and picture URL!');
    await addItemToCategory(categoryId, {
      name: itemName,
      picture: itemPic,
    });
    alert('Item added!');
    setItemName('');
    setItemPic('');
    fetchItemsForCategory(categoryId);
  };

  // Fetch all categories
  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const cats = [];
    for (const docSnap of querySnapshot.docs) {
      cats.push({ id: docSnap.id, ...docSnap.data() });
    }
    setCategories(cats);
    // Fetch items for all categories
    for (const cat of cats) {
      fetchItemsForCategory(cat.id);
    }
  };

  // Fetch items for a category
  const fetchItemsForCategory = async (catId) => {
    const itemsSnap = await getDocs(collection(db, 'categories', catId, 'items'));
    setItemsByCategory(prev => ({
      ...prev,
      [catId]: itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }));
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#f6f7fa', borderRadius: 12 }}>
      <h2>Add Category</h2>
      <input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Category name" style={{ width: '100%', marginBottom: 8, padding: 8 }} />
      <input value={categoryDescription} onChange={e => setCategoryDescription(e.target.value)} placeholder="Category description" style={{ width: '100%', marginBottom: 8, padding: 8 }} />
      <button onClick={handleAddCategory} style={{ width: '100%', marginBottom: 16 }}>Add Category</button>
      <h2>Add Item to Category</h2>
      <select
        value={categoryId}
        onChange={e => setCategoryId(e.target.value)}
        style={{ width: '100%', marginBottom: 8, padding: 8 }}
      >
        <option value="">Select category...</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item name" style={{ width: '100%', marginBottom: 8, padding: 8 }} />
      <input value={itemPic} onChange={e => setItemPic(e.target.value)} placeholder="Picture URL" style={{ width: '100%', marginBottom: 8, padding: 8 }} />
      <button onClick={handleAddItem} style={{ width: '100%' }}>Add Item</button>
      {categoryId && <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>Current Category ID: {categoryId}</div>}
      <hr style={{ margin: '32px 0' }} />
      <h2>All Categories & Items</h2>
      <div>
        {categories.map(cat => (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{cat.name}</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {(itemsByCategory[cat.id] || []).map(item => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  {item.picture && <img src={item.picture} alt={item.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, marginLeft: 8, verticalAlign: 'middle' }} />}
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>Upvotes: {item.upvotes} | Score: {item.indexScore}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel; 