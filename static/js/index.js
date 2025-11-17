const API_URL = '/api';
        let currentUsername = null; // Store current logged-in user's username

        // Get CSRF token from cookies
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }

        function getCsrfToken() {
            return getCookie('csrftoken');
        }

        // Initialize app
        async function init() {
            await loadMentors();
            await loadStats();
            await loadClasses();
            await loadFeedback();
        }

        // Load mentors
        async function loadMentors() {
            try {
                const response = await fetch(`${API_URL}/mentors`);
                if (!response.ok) {
                    throw new Error(`Failed to load mentors: ${response.status}`);
                }
                const mentors = await response.json();
                
                if (!Array.isArray(mentors)) {
                    throw new Error('Invalid response format from server');
                }
                
                const mentorSelects = [
                    document.getElementById('mentor'),
                    document.getElementById('mentorFilter')
                ];
                
                mentorSelects.forEach(select => {
                    if (!select) return; // Skip if element doesn't exist
                    
                    const currentValue = select.value;
                    // Keep the first option (Select a mentor / All Mentors)
                    const firstOption = select.options[0] ? select.options[0].text : '';
                    select.innerHTML = firstOption === 'Select a mentor' 
                        ? '<option value="">Select a mentor</option>'
                        : '<option value="">All Mentors</option>';
                    
                    if (mentors.length === 0) {
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = 'No mentors available';
                        option.disabled = true;
                        select.appendChild(option);
                    } else {
                        mentors.forEach(mentor => {
                            const option = document.createElement('option');
                            option.value = mentor;
                            option.textContent = mentor;
                            select.appendChild(option);
                        });
                    }
                    
                    if (currentValue) select.value = currentValue;
                });
            } catch (error) {
                console.error('Error loading mentors:', error);
                // Show error in mentor dropdown
                const mentorSelect = document.getElementById('mentor');
                if (mentorSelect) {
                    mentorSelect.innerHTML = '<option value="">Error loading mentors</option>';
                }
            }
        }

        // Show page
        function showPage(pageId, btn) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-btn').forEach(button => {
                button.classList.remove('active');
            });
            
            document.getElementById(pageId).classList.add('active');
            if (btn) btn.classList.add('active');

            // Load data when switching pages
            if (pageId === 'classes') loadClasses();
            if (pageId === 'filter') loadFeedback();
        }

        // Submit feedback
        async function submitFeedback(event) {
            event.preventDefault();
            
            // Validate required fields
            const reviewerName = document.getElementById('reviewerName').value.trim();
            const topic = document.getElementById('topic').value.trim();
            const mentor = document.getElementById('mentor').value;
            const rating = document.getElementById('rating').value;
            const comments = document.getElementById('comments').value.trim();
            
            // Use logged-in username if available, otherwise use entered name
            const finalReviewerName = currentUsername || reviewerName;
            
            if (!finalReviewerName) {
                showMessage('mainMessage', 'Please enter your name', 'error');
                return;
            }
            
            if (!topic) {
                showMessage('mainMessage', 'Please enter a topic name', 'error');
                return;
            }
            
            if (!mentor) {
                showMessage('mainMessage', 'Please select a mentor', 'error');
                return;
            }
            
            if (!rating || rating < 1 || rating > 10) {
                showMessage('mainMessage', 'Please enter a valid rating between 1 and 10', 'error');
                return;
            }
            
            if (!comments) {
                showMessage('mainMessage', 'Please enter feedback comments', 'error');
                return;
            }
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            const data = {
                reviewer_name: finalReviewerName, // Use logged-in username
                peer_name: topic, // Using peer_name field to store topic
                mentor: mentor,
                rating: parseInt(rating),
                comments: comments
            };
            
            console.log('Submitting feedback:', data);
            
            try {
                const csrfToken = getCsrfToken();
                const headers = {
                    'Content-Type': 'application/json',
                };
                
                // Add CSRF token if available
                if (csrfToken) {
                    headers['X-CSRFToken'] = csrfToken;
                }
                
                const response = await fetch(`${API_URL}/feedback/create`, {
                    method: 'POST',
                    headers: headers,
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('mainMessage', 'Feedback submitted successfully!', 'success');
                    event.target.reset();
                    await loadStats();
                    await loadMentors();
                    await loadFeedback();
                } else {
                    const errorMsg = result.error || (typeof result === 'object' ? JSON.stringify(result) : 'Failed to submit');
                    showMessage('mainMessage', 'Error: ' + errorMsg, 'error');
                    console.error('Submission error:', result);
                }
            } catch (error) {
                const errorMsg = error.message || 'Failed to connect to server. Make sure the backend is running!';
                showMessage('mainMessage', errorMsg, 'error');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Feedback';
            }
        }

        // Load stats
        async function loadStats() {
            try {
                const response = await fetch(`${API_URL}/stats`);
                if (!response.ok) throw new Error('Failed to load stats');
                const stats = await response.json();
                
                document.getElementById('totalFeedback').textContent = stats.totalFeedback || 0;
                document.getElementById('avgRating').textContent = stats.avgRating || '0.0';
                document.getElementById('activeMentors').textContent = stats.activeMentors || 0;
            } catch (error) {
                console.error('Error loading stats:', error);
                document.getElementById('totalFeedback').textContent = '0';
                document.getElementById('avgRating').textContent = '0.0';
                document.getElementById('activeMentors').textContent = '0';
            }
        }

        // Load classes
        async function loadClasses() {
            const classList = document.getElementById('classesList');
            
            try {
                const response = await fetch(`${API_URL}/classes`);
                if (!response.ok) throw new Error('Failed to load classes');
                const classes = await response.json();
                
                if (classes.length === 0) {
                    classList.innerHTML = '<p class="loading">No classes found</p>';
                    return;
                }
                
                classList.innerHTML = classes.map(cls => `
                    <div class="class-card">
                        <h3>${cls.class_name}</h3>
                        <p>${cls.description}</p>
                        <div class="class-info">
                            <div class="info-item">
                                <span class="info-label">Mentor</span>
                                <span class="info-value">${cls.mentor}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Students</span>
                                <span class="info-value">${cls.student_count}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Avg Rating</span>
                                <span class="info-value">${cls.avg_rating ? cls.avg_rating.toFixed(1) : 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Feedback Count</span>
                                <span class="info-value">${cls.feedback_count}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                classList.innerHTML = '<div class="error">Failed to load classes. Make sure the backend is running!</div>';
                console.error('Error:', error);
            }
        }

        // Load feedback
        async function loadFeedback(mentor = '') {
            const feedbackList = document.getElementById('feedbackList');
            if (!feedbackList) return;
            
            feedbackList.innerHTML = '<p class="loading">Loading feedback...</p>';
            
            try {
                const url = mentor ? `${API_URL}/feedback?mentor=${encodeURIComponent(mentor)}` : `${API_URL}/feedback`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to load feedback');
                const feedback = await response.json();
                
                if (feedback.length === 0) {
                    feedbackList.innerHTML = `
                        <p style="text-align: center; color: #718096; padding: 40px;">
                            ${mentor ? `No feedback found for ${mentor}` : 'No feedback submitted yet'}
                        </p>
                    `;
                    return;
                }
                
                feedbackList.innerHTML = feedback.map(f => {
                    const date = new Date(f.date_submitted);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    // Check if current user can delete this feedback (only their own)
                    const canDelete = currentUsername && f.reviewer_name.toLowerCase() === currentUsername.toLowerCase();
                    return `
                        <div class="feedback-item">
                            ${canDelete ? `<button style="margin-top: 90px;" class="delete-btn" onclick="deleteFeedback(${f.id})">Delete</button>` : ''}
                            <div class="feedback-header">
                                <div>
                                    ${f.peer_name ? `<strong style="color: #667eea; font-size: 18px; display: block; margin-bottom: 5px;">${f.peer_name}</strong>` : ''}
                                    <p style="color: #718096; font-size: 14px; margin-top: 5px;">
                                        Reviewed by ${f.reviewer_name} • ${formattedDate}
                                    </p>
                                </div>
                                <div class="rating">${f.rating}/10</div>
                            </div>
                            <p style="color: #4a5568; margin-bottom: 10px;"><strong>Mentor:</strong> ${f.mentor}</p>
                            <p style="color: #2d3748;">${f.comments}</p>
                        </div>
                    `;
                }).join('');
            } catch (error) {
                feedbackList.innerHTML = '<div class="error">Failed to load feedback. Make sure the backend is running!</div>';
                console.error('Error:', error);
            }
        }

        // Apply filter
        function applyFilter() {
            const mentor = document.getElementById('mentorFilter').value;
            loadFeedback(mentor);
        }

        // Delete feedback
        async function deleteFeedback(id) {
            if (!confirm('Are you sure you want to delete this feedback?')) return;
            
            try {
                const csrfToken = getCsrfToken();
                const headers = {};
                
                // Add CSRF token if available
                if (csrfToken) {
                    headers['X-CSRFToken'] = csrfToken;
                }
                
                const response = await fetch(`${API_URL}/feedback/${id}`, {
                    method: 'DELETE',
                    headers: headers,
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    await loadStats();
                    const mentor = document.getElementById('mentorFilter')?.value || '';
                    await loadFeedback(mentor);
                } else {
                    alert('Failed to delete feedback: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                alert('Failed to delete feedback: ' + error.message);
                console.error('Error:', error);
            }
        }

        // Show message
        function showMessage(elementId, message, type) {
            const el = document.getElementById(elementId);
            el.innerHTML = `<div class="${type}">${message}</div>`;
            setTimeout(() => el.innerHTML = '', 5000);
        }

        // Authentication functions
        async function checkAuth() {
            try {
                const response = await fetch(`${API_URL}/auth/check`, {
                    credentials: 'include'
                });
                const result = await response.json();
                
                if (!result.authenticated) {
                    window.location.href = '/login';
                    return;
                }
                
                // Display user info and store username
                const userInfo = document.getElementById('userInfo');
                if (userInfo && result.user) {
                    currentUsername = result.user.username;
                    userInfo.textContent = `👤 ${currentUsername}`;
                    
                    // Auto-fill the reviewer name field with username
                    const reviewerNameField = document.getElementById('reviewerName');
                    if (reviewerNameField) {
                        reviewerNameField.value = currentUsername;
                        reviewerNameField.readOnly = true;
                        reviewerNameField.style.backgroundColor = '#f0f0f0';
                        reviewerNameField.style.cursor = 'not-allowed';
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                window.location.href = '/login';
            }
        }

        async function handleLogout() {
            if (!confirm('Are you sure you want to logout?')) return;
            
            try {
                const response = await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    // Even if response is not ok, try to parse it
                    try {
                        const errorResult = await response.json();
                        console.error('Logout error response:', errorResult);
                    } catch (e) {
                        console.error('Logout failed with status:', response.status);
                    }
                    // Still redirect to login
                    window.location.href = '/login';
                    return;
                }
                
                const result = await response.json();
                
                // Always redirect to login, regardless of response
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout error:', error);
                // Redirect anyway - logout should always succeed from user perspective
                window.location.href = '/login';
            }
        }

        // Initialize on load
        checkAuth().then(() => {
            init();
        });