const CategoryManager = ({ categories, onSave, onCancel }) => {
    const [categoryList, setCategoryList] = useState(categories);
    const [newCategory, setNewCategory] = useState({ id: '', name: '', color: 'blue' });
    const [editingIndex, setEditingIndex] = useState(-1);

    const colors = ['blue', 'green', 'purple', 'red', 'yellow', 'indigo', 'pink', 'gray', 'orange'];

    const addCategory = () => {
        if (newCategory.id && newCategory.name) {
            setCategoryList([...categoryList, { ...newCategory }]);
            setNewCategory({ id: '', name: '', color: 'blue' });
        }
    };

    const updateCategory = (index, field, value) => {
        const updated = [...categoryList];
        updated[index] = { ...updated[index], [field]: value };
        setCategoryList(updated);
    };

    const deleteCategory = (index) => {
        if (confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) {
            setCategoryList(categoryList.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6 text-right">ניהול קטגוריות</h2>

                    {/* הוספת קטגוריה חדשה */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 text-right">הוספת קטגוריה חדשה</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="ID (באנגלית)"
                                value={newCategory.id}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, id: e.target.value }))}
                                className="p-2 border border-gray-300 rounded text-right"
                            />
                            <input
                                type="text"
                                placeholder="שם הקטגוריה"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                className="p-2 border border-gray-300 rounded text-right"
                            />
                            <select
                                value={newCategory.color}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                                className="p-2 border border-gray-300 rounded text-right"
                            >
                                {colors.map(color => (
                                    <option key={color} value={color}>{color}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={addCategory}
                            className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            <Plus size={16} className="inline mr-2" />
                            הוסף קטגוריה
                        </button>
                    </div>

                    {/* רשימת קטגוריות קיימות */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-right">קטגוריות קיימות</h3>
                        {categoryList.map((category, index) => (
                            <div key={category.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingIndex(editingIndex === index ? -1 : index)}
                                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        title="ערוך"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteCategory(index)}
                                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        title="מחק"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {editingIndex === index ? (
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            value={category.id}
                                            onChange={(e) => updateCategory(index, 'id', e.target.value)}
                                            className="p-2 border border-gray-300 rounded text-right"
                                        />
                                        <input
                                            type="text"
                                            value={category.name}
                                            onChange={(e) => updateCategory(index, 'name', e.target.value)}
                                            className="p-2 border border-gray-300 rounded text-right"
                                        />
                                        <select
                                            value={category.color}
                                            onChange={(e) => updateCategory(index, 'color', e.target.value)}
                                            className="p-2 border border-gray-300 rounded text-right"
                                        >
                                            {colors.map(color => (
                                                <option key={color} value={color}>{color}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-end gap-4">
                                        <span className="text-gray-600">{category.id}</span>
                                        <span className="font-medium">{category.name}</span>
                                        <span className={`px-3 py-1 rounded text-white bg-${category.color}-500`}>
                                            {category.color}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-6 mt-6 border-t">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            ביטול
                        </button>
                        <button
                            onClick={() => onSave(categoryList)}
                            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            <Save size={16} className="inline mr-2" />
                            שמור שינויים
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};