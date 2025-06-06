import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { searchSkills, getCategories, getSkillsByCategory, POPULAR_SKILLS } from '../data/skillsDatabase';

const SkillsEditor = ({ skills = [], onChange, className = '' }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle input change and show suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const filteredSuggestions = searchSkills(value, 15).filter(
        skill => !skills.some(existingSkill => 
          existingSkill.toLowerCase() === skill.toLowerCase()
        )
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Add skill
  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.some(s => s.toLowerCase() === trimmedSkill.toLowerCase())) {
      onChange([...skills, trimmedSkill]);
      setInputValue('');
      setShowSuggestions(false);
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove) => {
    onChange(skills.filter(skill => skill !== skillToRemove));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // Enter key - add selected suggestion or current input
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        addSkill(suggestions[activeSuggestionIndex]);
      } else if (inputValue.trim()) {
        addSkill(inputValue);
      }
    } 
    // Escape key - hide suggestions
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } 
    // Arrow down - move selection down
    else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } 
    // Arrow up - move selection up
    else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Tab key - add selected suggestion
    else if (e.key === 'Tab' && showSuggestions && activeSuggestionIndex >= 0) {
      e.preventDefault();
      addSkill(suggestions[activeSuggestionIndex]);
    }
    // Comma - add current input as skill
    else if (e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addSkill(inputValue);
      }
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categories for browsing skills
  const categories = ['Popular', ...getCategories()];
  const categorySkills = getSkillsByCategory(selectedCategory)
    .filter(skill => !skills.some(s => s.toLowerCase() === skill.toLowerCase()));

  return (
    <div className={`skills-editor ${className}`}>
      {/* Selected Skills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((skill, index) => (
          <div 
            key={index}
            className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
          >
            <span>{skill}</span>            <button 
              onClick={() => removeSkill(skill)} 
              className="hover:bg-black/20 rounded-full p-1"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Input and Suggestions */}
      <div className="relative mb-6">
        <div className="relative">          <input
            ref={inputRef}
            type="text"
            className="w-full px-10 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
            placeholder="Type to search skills or browse below..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Search suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (          <ul 
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border border-border rounded-md shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className={`px-4 py-2 cursor-pointer hover:bg-muted text-popover-foreground ${
                  activeSuggestionIndex === index ? 'bg-muted' : ''
                }`}
                onClick={() => addSkill(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Category Tabs */}
      <div className="mb-4 border-b">
        <div className="flex overflow-x-auto pb-1">
          {categories.map((category, index) => (
            <button
              key={index}              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                selectedCategory === category 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Skills by category */}
      <div className="flex flex-wrap gap-2">
        {categorySkills.slice(0, 20).map((skill, index) => (
          <button
            key={index}
            onClick={() => addSkill(skill)}
            className="flex items-center gap-1 border border-border hover:border-primary bg-muted hover:bg-muted/80 px-3 py-1 rounded-full text-sm transition-colors"
          >
            <Plus size={14} />
            {skill}
          </button>
        ))}
        {categorySkills.length === 0 && (
          <p className="text-muted-foreground text-sm py-2">
            {selectedCategory === 'Popular' 
              ? 'You\'ve added all popular skills! Browse other categories.'
              : `You've added all ${selectedCategory.toLowerCase()} skills!`}
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillsEditor;