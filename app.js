let wordLists = {}; // Object to store multiple lists: {listId: {name, words, enabled}}
        let currentWordIndex = 0;
        let correctCount = 0;
        let correctStreak = 0; // Track consecutive correct answers
        let easterEggShown = false; // Track if we've shown it this session
        let activeWords = []; // Combined words from enabled lists
        let speechSynthesis = window.speechSynthesis;
        let isSpeaking = false;

        function openSettings() {
            document.getElementById('settingsPanel').classList.add('active');
            displayWordLists();
        }

        function closeSettings() {
            document.getElementById('settingsPanel').classList.remove('active');
            // Refresh practice mode with any changes
            prepareActiveWords();
            if (activeWords.length > 0 && currentWordIndex === 0) {
                startPractice();
            }
        }

        function closeEasterEgg() {
            document.getElementById('easterEgg').classList.remove('active');
            // Continue with next word
            currentWordIndex++;
            showCurrentWord();
        }

        function testSpeech() {
            if (!('speechSynthesis' in window)) {
                alert('❌ Text-to-speech is NOT supported in this browser.\n\nPlease try:\n- Chrome browser\n- Safari browser\n- Firefox browser');
                return;
            }

            alert('✓ Text-to-speech is supported!\n\nYou should hear the word "hello" now.\n\nMake sure your device volume is turned up!');
            
            speechSynthesis.cancel();
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance('hello');
                utterance.rate = 0.7;
                utterance.pitch = 1.2;
                utterance.volume = 1.0;
                utterance.lang = 'en-US';
                
                utterance.onerror = function(event) {
                    alert('❌ Speech error: ' + event.error + '\n\nTry:\n1. Check device volume\n2. Close and reopen the page\n3. Try a different browser');
                };
                
                speechSynthesis.speak(utterance);
            }, 100);
        }

        function switchMode(mode) {
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.setup-mode').classList.remove('active');
            document.querySelector('.practice-mode').classList.remove('active');

            if (mode === 'setup') {
                document.querySelectorAll('.mode-btn')[0].classList.add('active');
                document.querySelector('.setup-mode').classList.add('active');
                displayWordLists();
            } else {
                document.querySelectorAll('.mode-btn')[1].classList.add('active');
                document.querySelector('.practice-mode').classList.add('active');
                prepareActiveWords();
                if (activeWords.length > 0) {
                    startPractice();
                } else {
                    document.getElementById('currentWord').textContent = 'No Words!';
                    document.getElementById('statusMessage').textContent = 'Please add and enable word lists in Setup mode';
                }
            }
        }

        function saveNewList() {
            const listName = document.getElementById('listName').value.trim();
            const input = document.getElementById('wordInput').value;
            
            if (!listName) {
                alert('Please enter a name for this list!');
                return;
            }

            const words = input
                .split(/[\n,\s]+/)
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length > 0);

            if (words.length === 0) {
                alert('Please enter at least one word!');
                return;
            }

            const listId = Date.now().toString();
            wordLists[listId] = {
                name: listName,
                words: words,
                enabled: true
            };

            saveToStorage();
            displayWordLists();
            
            // Clear inputs
            document.getElementById('listName').value = '';
            document.getElementById('wordInput').value = '';
            
            alert(`✓ Created list "${listName}" with ${words.length} words!`);
        }

        function displayWordLists() {
            const container = document.getElementById('wordLists');
            
            if (Object.keys(wordLists).length === 0) {
                container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No lists yet. Create your first list above!</p>';
                return;
            }

            container.innerHTML = '';
            
            for (const [listId, list] of Object.entries(wordLists)) {
                const listDiv = document.createElement('div');
                listDiv.className = 'list-item' + (list.enabled ? ' active' : '');
                
                listDiv.innerHTML = `
                    <input type="checkbox" class="list-checkbox" ${list.enabled ? 'checked' : ''} 
                           onchange="toggleList('${listId}')">
                    <div class="list-info">
                        <div class="list-name">${list.name}</div>
                        <div class="list-count">${list.words.length} words</div>
                    </div>
                    <div class="list-actions">
                        <button class="small-btn" onclick="viewList('${listId}')">👁️ View</button>
                        <button class="small-btn" onclick="editList('${listId}')">✏️ Edit</button>
                        <button class="small-btn" onclick="deleteList('${listId}')">🗑️</button>
                    </div>
                `;
                
                container.appendChild(listDiv);
            }
        }

        function toggleList(listId) {
            wordLists[listId].enabled = !wordLists[listId].enabled;
            saveToStorage();
            displayWordLists();
        }

        function viewList(listId) {
            const list = wordLists[listId];
            alert(`📚 ${list.name}\n\n${list.words.join(', ')}`);
        }

        function editList(listId) {
            const list = wordLists[listId];
            document.getElementById('listName').value = list.name;
            document.getElementById('wordInput').value = list.words.join(', ');
            
            if (confirm(`Load "${list.name}" for editing?\n\nClick OK to edit, then save as a new list or update the name.`)) {
                // Optionally delete the old list
                if (confirm('Delete the original list after loading?')) {
                    delete wordLists[listId];
                    saveToStorage();
                    displayWordLists();
                }
            }
        }

        function deleteList(listId) {
            const list = wordLists[listId];
            if (confirm(`Delete "${list.name}"?\n\nThis cannot be undone!`)) {
                delete wordLists[listId];
                saveToStorage();
                displayWordLists();
                alert('✓ List deleted!');
            }
        }

        function loadSampleWords() {
            const sampleWords = "the, and, a, to, said, in, he, I, of, it, was, you, they, on, she, is, for, at, his, but, that, with, all, we, can, are, up, had, my, her, what, there, out, this, have, went, be, like, some, so, not, then, were, go, little, as, no, make, down, way, could, did, one, two";
            document.getElementById('wordInput').value = sampleWords;
            document.getElementById('listName').value = 'Sample - Common Sight Words';
        }

        function prepareActiveWords() {
            activeWords = [];
            for (const list of Object.values(wordLists)) {
                if (list.enabled) {
                    activeWords.push(...list.words);
                }
            }
            // Remove duplicates
            activeWords = [...new Set(activeWords)];
        }

        function startPractice() {
            currentWordIndex = 0;
            correctCount = 0;
            correctStreak = 0;
            easterEggShown = false;
            shuffleWords();
            showCurrentWord();
        }

        function shuffleWords() {
            for (let i = activeWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [activeWords[i], activeWords[j]] = [activeWords[j], activeWords[i]];
            }
        }

        function showCurrentWord() {
            if (currentWordIndex >= activeWords.length) {
                showCompletion();
                return;
            }

            document.getElementById('currentWord').textContent = activeWords[currentWordIndex];
            document.getElementById('feedback').textContent = '';
            document.getElementById('celebration').textContent = '';
            document.getElementById('statusMessage').textContent = 'Click the speaker to hear the word!';
            document.getElementById('speakButton').style.display = 'block';
            updateProgress();
        }

        function updateProgress() {
            const progress = document.getElementById('progress');
            const enabledCount = Object.values(wordLists).filter(l => l.enabled).length;
            progress.textContent = `Word ${currentWordIndex + 1} of ${activeWords.length} • Correct: ${correctCount} • Lists: ${enabledCount}`;
        }

        function speakWord() {
            // Check if speech synthesis is available
            if (!('speechSynthesis' in window)) {
                alert('Text-to-speech is not supported in this browser. Please try Chrome or Safari.');
                return;
            }

            if (isSpeaking) {
                speechSynthesis.cancel();
                isSpeaking = false;
                document.getElementById('speakButton').classList.remove('speaking');
                return;
            }

            const currentWord = activeWords[currentWordIndex];
            
            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            // Small delay to ensure cancellation completes
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(currentWord);
                
                // Configure speech settings for clearer pronunciation
                utterance.rate = 0.7; // Slower for clarity
                utterance.pitch = 1.2; // Higher pitch for child-friendly voice
                utterance.volume = 1.0;
                utterance.lang = 'en-US';
                
                const speakButton = document.getElementById('speakButton');
                speakButton.classList.add('speaking');
                isSpeaking = true;

                utterance.onstart = function() {
                    console.log('Speech started');
                };

                utterance.onend = function() {
                    console.log('Speech ended');
                    speakButton.classList.remove('speaking');
                    isSpeaking = false;
                };

                utterance.onerror = function(event) {
                    console.error('Speech error:', event);
                    speakButton.classList.remove('speaking');
                    isSpeaking = false;
                    alert('Could not speak the word. Please check your device volume and try again.');
                };

                try {
                    speechSynthesis.speak(utterance);
                    console.log('Speaking:', currentWord);
                } catch (error) {
                    console.error('Error calling speak:', error);
                    speakButton.classList.remove('speaking');
                    isSpeaking = false;
                    alert('Error with text-to-speech: ' + error.message);
                }
            }, 100);
        }

        function markCorrect() {
            const feedback = document.getElementById('feedback');
            const celebration = document.getElementById('celebration');
            
            feedback.textContent = '✓ Great job!';
            feedback.className = 'feedback correct';
            celebration.textContent = '🌟';
            correctCount++;
            correctStreak++;

            // Check for Easter egg trigger
            if (correctStreak === 10 && !easterEggShown) {
                easterEggShown = true;
                setTimeout(() => {
                    document.getElementById('easterEgg').classList.add('active');
                }, 1500);
                // Don't advance to next word automatically - let them enjoy the moment
                return;
            }
            
            setTimeout(() => {
                currentWordIndex++;
                showCurrentWord();
            }, 1500);
        }

        function nextWord() {
            correctStreak = 0; // Reset streak if they skip
            currentWordIndex++;
            showCurrentWord();
        }

        function resetPractice() {
            startPractice();
        }

        function showCompletion() {
            const percentage = Math.round((correctCount / activeWords.length) * 100);
            document.getElementById('currentWord').textContent = 'All Done!';
            document.getElementById('statusMessage').textContent = '';
            document.getElementById('feedback').textContent = `You got ${correctCount} out of ${activeWords.length} correct! (${percentage}%)`;
            document.getElementById('feedback').className = 'feedback correct';
            document.getElementById('celebration').textContent = '🎉🎊🌟';
            document.getElementById('speakButton').style.display = 'none';
        }

        function saveToStorage() {
            localStorage.setItem('sightWordLists', JSON.stringify(wordLists));
        }

        function loadFromStorage() {
            const saved = localStorage.getItem('sightWordLists');
            if (saved) {
                wordLists = JSON.parse(saved);
                displayWordLists();
            }
        }

        function exportAllLists() {
            if (Object.keys(wordLists).length === 0) {
                alert('No lists to export!');
                return;
            }

            const data = JSON.stringify(wordLists, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sight-words-all-lists.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('✓ All lists exported!\n\nSaved as: sight-words-all-lists.json');
        }

        function importLists(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    
                    if (confirm(`Import ${Object.keys(imported).length} lists?\n\nThis will ADD to your existing lists.`)) {
                        wordLists = { ...wordLists, ...imported };
                        saveToStorage();
                        displayWordLists();
                        alert('✓ Lists imported successfully!');
                    }
                } catch (error) {
                    alert('❌ Error importing file. Make sure it\'s a valid sight words list file.');
                }
            };
            reader.readAsText(file);
            
            // Reset file input
            event.target.value = '';
        }

        // Load saved lists on startup and start practice if lists exist
        window.onload = function() {
            loadFromStorage();
            prepareActiveWords();
            if (activeWords.length > 0) {
                startPractice();
            } else {
                document.getElementById('currentWord').textContent = 'No Words Yet!';
                document.getElementById('statusMessage').textContent = 'Click the ⚙️ gear icon to add word lists';
                document.getElementById('speakButton').style.display = 'none';
            }
        };