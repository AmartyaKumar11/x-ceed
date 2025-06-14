// Create a test URL for the StayFinder prep plan
const stayFinderJob = {
  id: "stayfinder-test",
  title: "Full Stack Web Developer - StayFinder Project",
  companyName: "Internship Program",
  description: `We're building StayFinder, a full-stack web app similar to Airbnb, where users can list and book properties for short-term or long-term stays. This intern project will give you experience across both frontend and backend development.

✅ Objectives:
Build a functional prototype with:
Frontend: Property listing, search, details page, login/register
Backend: RESTful API for listings, user auth, bookings.
Database: Store users, listings, bookings.

📦 Deliverables:
Frontend (React preferred):
Homepage with property cards (image, location, price).
Listing detail page with images, description, calendar.
Login/Register pages with validation.
(Optional) Host dashboard to manage listings.

Backend (Node.js/Express or Django):
Auth routes: register, login.
Listings endpoints: GET /listings, GET /listings/:id.
POST /bookings for reservations.
Basic listing CRUD for hosts.

Database (MongoDB/PostgreSQL):
Models: Users, Listings, Bookings.
Include seed data for testing.

Bonus (Optional):
Search with filters (location, price, date).
Map integration (Google Maps/Mapbox).
Mock payment integration (e.g., Stripe).`,
  level: "Intern",
  location: "Remote",
  salary: "$0-$20000",
  status: "active"
};

// Encode the job data for URL
const encodedJob = encodeURIComponent(JSON.stringify(stayFinderJob));
const testUrl = `http://localhost:3002/dashboard/applicant/prep-plan?job=${encodedJob}`;

console.log('🔗 Test URL for StayFinder prep plan:');
console.log(testUrl);
console.log('\n📋 Copy this URL and paste it in your browser to test the prep plan generation');
console.log('📝 Check the browser console for debug logs');

// Also create a shorter URL for easier testing
console.log('\n🎯 Or test with a real saved job:');
console.log('1. Go to http://localhost:3002/dashboard/applicant/saved-jobs');
console.log('2. Click "Create Prep Plan" on your StayFinder job');
console.log('3. Check browser console for debug logs');
console.log('4. The prep plan should show StayFinder-specific topics!');
