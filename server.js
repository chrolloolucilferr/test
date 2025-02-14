// DOM Elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-links a');
const workoutForm = document.getElementById('workout-form');
const nutritionForm = document.getElementById('nutrition-form');
const goalForm = document.getElementById('goal-form');
const workoutList = document.getElementById('workout-list');
const mealList = document.getElementById('meal-list');
const goalsList = document.getElementById('goals-list');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        
        // Update active section
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });

        // Update active link
        navLinks.forEach(navLink => {
            navLink.classList.remove('active');
        });
        link.classList.add('active');
    });
});

// Local Storage Functions
const getStorageData = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const setStorageData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Workout Tracking
workoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const workout = {
        id: Date.now(),
        type: document.getElementById('workout-type').value,
        duration: parseInt(document.getElementById('duration').value),
        calories: parseInt(document.getElementById('calories').value),
        notes: document.getElementById('notes').value,
        date: new Date().toISOString()
    };

    const workouts = getStorageData('workouts');
    workouts.push(workout);
    setStorageData('workouts', workouts);

    workoutForm.reset();
    updateWorkoutList();
    updateDashboardStats();
});

function updateWorkoutList() {
    const workouts = getStorageData('workouts');
    workoutList.innerHTML = workouts.map(workout => `
        <div class="workout-item">
            <h4>${workout.type}</h4>
            <p>${workout.duration} minutes | ${workout.calories} calories</p>
            <p class="notes">${workout.notes}</p>
            <small>${new Date(workout.date).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Nutrition Tracking
nutritionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const meal = {
        id: Date.now(),
        type: document.getElementById('meal-type').value,
        name: document.getElementById('food-name').value,
        calories: parseInt(document.getElementById('food-calories').value),
        protein: parseInt(document.getElementById('protein').value) || 0,
        carbs: parseInt(document.getElementById('carbs').value) || 0,
        fat: parseInt(document.getElementById('fat').value) || 0,
        date: new Date().toISOString()
    };

    const meals = getStorageData('meals');
    meals.push(meal);
    setStorageData('meals', meals);

    nutritionForm.reset();
    updateMealList();
    updateDashboardStats();
});

function updateMealList() {
    const meals = getStorageData('meals');
    const today = new Date().toDateString();
    
    const todaysMeals = meals.filter(meal => 
        new Date(meal.date).toDateString() === today
    );

    mealList.innerHTML = todaysMeals.map(meal => `
        <div class="meal-item">
            <h4>${meal.name}</h4>
            <p>${meal.type} | ${meal.calories} calories</p>
            <p>Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g</p>
        </div>
    `).join('');
}

// Goals Tracking
goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const goal = {
        id: Date.now(),
        type: document.getElementById('goal-type').value,
        title: document.getElementById('goal-title').value,
        target: document.getElementById('goal-target').value,
        targetDate: document.getElementById('goal-date').value,
        completed: false,
        date: new Date().toISOString()
    };

    const goals = getStorageData('goals');
    goals.push(goal);
    setStorageData('goals', goals);

    goalForm.reset();
    updateGoalsList();
});

function updateGoalsList() {
    const goals = getStorageData('goals');
    goalsList.innerHTML = goals.map(goal => `
        <div class="goal-item ${goal.completed ? 'completed' : ''}">
            <h4>${goal.title}</h4>
            <p>${goal.type} goal | Target: ${goal.target}</p>
            <p>Target Date: ${new Date(goal.targetDate).toLocaleDateString()}</p>
            <button onclick="toggleGoal(${goal.id})" class="btn btn-small">
                ${goal.completed ? 'Completed' : 'Mark Complete'}
            </button>
        </div>
    `).join('');
}

function toggleGoal(goalId) {
    const goals = getStorageData('goals');
    const updatedGoals = goals.map(goal => {
        if (goal.id === goalId) {
            return { ...goal, completed: !goal.completed };
        }
        return goal;
    });
    setStorageData('goals', updatedGoals);
    updateGoalsList();
}

// Dashboard Stats
function updateDashboardStats() {
    const workouts = getStorageData('workouts');
    const meals = getStorageData('meals');
    const today = new Date().toDateString();

    // Calculate today's stats
    const todaysWorkouts = workouts.filter(workout => 
        new Date(workout.date).toDateString() === today
    );
    const todaysMeals = meals.filter(meal => 
        new Date(meal.date).toDateString() === today
    );

    const caloriesBurned = todaysWorkouts.reduce((sum, workout) => sum + workout.calories, 0);
    const caloriesConsumed = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);

    document.getElementById('calories-burned').textContent = caloriesBurned;
    document.getElementById('calories-consumed').textContent = caloriesConsumed;

    // Update weekly chart
    updateWeeklyChart();
}

function updateWeeklyChart() {
    const ctx = document.getElementById('weekly-chart').getContext('2d');
    const workouts = getStorageData('workouts');
    
    // Get last 7 days
    const labels = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const data = labels.map((label, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dayWorkouts = workouts.filter(workout => 
            new Date(workout.date).toDateString() === date.toDateString()
        );
        return dayWorkouts.reduce((sum, workout) => sum + workout.calories, 0);
    });

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Calories Burned',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories'
                    }
                }
            }
        }
    });
}

// Initial load
updateWorkoutList();
updateMealList();
updateGoalsList();
updateDashboardStats();