let courses = [];
let tfidfVectors = new Map();
let debounceTimer;

// Load Courses from JSON
async function loadCourses() {
    const response = await fetch('udemy_it_courses.json');
    courses = await response.json();
    calculateTFIDF();
    displayCourses(courses);
}

// Optimized TF-IDF Calculation
function calculateTFIDF() {
    const allTitles = courses.map(course => course.title.toLowerCase());
    const wordFrequency = {};

    allTitles.forEach(title => {
        const words = title.split(/\s+/);
        words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
    });

    courses.forEach(course => {
        const titleWords = course.title.toLowerCase().split(/\s+/);
        const tfidf = {};

        titleWords.forEach(word => {
            const tf = titleWords.filter(w => w === word).length / titleWords.length;
            const idf = Math.log(courses.length / (1 + (wordFrequency[word] || 0)));
            tfidf[word] = tf * idf;
        });

        tfidfVectors.set(course.title.toLowerCase(), tfidf);
    });
}

// Optimized TF-IDF Search Matching
function getTFIDFScore(title, keyword) {
    const tfidf = tfidfVectors.get(title.toLowerCase()) || {};
    return keyword.toLowerCase().split(/\s+/).reduce((score, word) => score + (tfidf[word] || 0), 0);
}

// Display Courses
function displayCourses(filteredCourses) {
    const container = document.getElementById('courses');
    container.innerHTML = '';

    filteredCourses.forEach(course => {
        let courseElement = document.createElement('div');
        courseElement.classList.add('course');

        let courseUrl = course.url.startsWith("https://www.udemy.com") ? course.url : `https://www.udemy.com${course.url}`;
        let stars = getStarRating(course.avg_rating);

        let price = course.price_detail__price_string ? course.price_detail__price_string : 'Not Available';
        let numReviews = course.num_reviews ? course.num_reviews : 'No Reviews';

        courseElement.innerHTML = `
            <h3>${course.title}</h3>
            <p class="rating-stars">Rating: ${stars}</p>
            <p>Reviews: ${numReviews}</p>
            <p>Price: ${price}</p>
            <p>Subscribers: ${course.num_subscribers}</p>
            <a href="${courseUrl}" target="_blank" class="apply-btn">Apply</a>
        `;
        container.appendChild(courseElement);
    });
}

// Debounced Filter Function (Increased Delay for Stability)
function debounceFilterCourses() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterCourses, 300); // Increased to 300ms to reduce lags
}

// Optimized Filtering Logic
function filterCourses() {
    let keyword = document.getElementById('searchTitle').value.toLowerCase();
    let selectedRating = document.querySelector(".rating-buttons button.active")?.dataset.rating || 0;
    let maxPrice = document.getElementById('priceRange').value;
    document.getElementById('priceLabel').textContent = `Show courses up to ₹${maxPrice}`;

    let filtered = courses
        .map(course => ({
            ...course,
            score: getTFIDFScore(course.title, keyword)
        }))
        .filter(course => (
            course.score > 0 &&
            course.avg_rating >= selectedRating &&
            extractNumericPrice(course.price_detail__price_string || '') <= maxPrice
        ))
        .sort((a, b) => b.score - a.score); // Sort by relevance

    displayCourses(filtered);
}

// Extracts numeric value from "₹8,640" format
function extractNumericPrice(priceText) {
    let priceNumber = priceText.replace(/[^0-9]/g, '');
    return priceNumber ? parseInt(priceNumber, 10) : 0;
}

// Star Rating Formatter
function getStarRating(rating) {
    let fullStars = Math.floor(rating);
    let halfStar = rating % 1 >= 0.5 ? '★' : '';
    return '★'.repeat(fullStars) + halfStar + '☆'.repeat(5 - fullStars - halfStar.length);
}

// Attach Event Listeners
document.getElementById("searchTitle").addEventListener("keyup", debounceFilterCourses);
document.getElementById("priceRange").addEventListener("input", filterCourses);

// Rating Filter - Button Click Handling
document.querySelectorAll(".rating-buttons button").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".rating-buttons button").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        filterCourses();
    });
});

// Load Courses Initially
loadCourses();
