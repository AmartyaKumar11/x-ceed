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
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        addSkill(inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          addSkill(suggestions[activeSuggestionIndex]);
        } else if (inputValue.trim()) {
          addSkill(inputValue);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      case 'Tab':
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          addSkill(suggestions[activeSuggestionIndex]);
        }
        break;
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category === 'Popular') {
      setSuggestions(POPULAR_SKILLS.filter(
        skill => !skills.some(existingSkill => 
          existingSkill.toLowerCase() === skill.toLowerCase()
        )
      ));
    } else {
      setSuggestions(getSkillsByCategory(category).filter(
        skill => !skills.some(existingSkill => 
          existingSkill.toLowerCase() === skill.toLowerCase()
        )
      ));
    }
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
    setInputValue('');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['Popular', ...getCategories()];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Skills Input Section */}
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-semibold text-black mb-3">
            <Search size={16} className="inline mr-2" />
            Add Skills
          </label>
          
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
              placeholder="Type a skill (e.g., JavaScript, Python, React...)"
            />
            
            {inputValue && (
              <button
                onClick={() => addSkill(inputValue)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Add skill"
              >
                <Plus size={16} className="text-gray-600" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => addSkill(suggestion)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    index === activeSuggestionIndex ? 'bg-black text-white' : 'text-gray-900'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto space-x-1 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 font-medium">
          {skills.length === 0 
            ? "Start typing or browse categories to add your skills. These help match you with relevant opportunities."
            : `${skills.length} skill${skills.length !== 1 ? 's' : ''} added. Add more to improve your profile visibility.`
          }
        </p>
      </div>

      {/* Skills Display */}
      {skills.length > 0 && (
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-black">Your Skills ({skills.length})</h4>
            {skills.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <div
                key={`${skill}-${index}`}
                className="group flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <span>{skill}</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                  title={`Remove ${skill}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Suggestions when no input */}
      {!inputValue && !showSuggestions && skills.length < 10 && (
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
          <h4 className="text-sm font-semibold text-black mb-4">Popular Skills to Add</h4>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SKILLS.filter(skill => 
              !skills.some(existingSkill => 
                existingSkill.toLowerCase() === skill.toLowerCase()
              )
            ).slice(0, 12).map((skill) => (
              <button
                key={skill}
                onClick={() => addSkill(skill)}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-black hover:text-white hover:border-black transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsEditor;
