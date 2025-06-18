// Test StayFinder job description parsing
import fetch from 'node-fetch';

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
  level: "Intern"
};

async function testStayFinderParsing() {
  console.log('🧪 Testing StayFinder Job Description Parsing\n');
  console.log(`📋 Job: ${stayFinderJob.title}`);
  console.log(`🏢 Company: ${stayFinderJob.companyName}`);
  console.log(`📊 Level: ${stayFinderJob.level}\n`);
  
  try {
    console.log('🤖 Step 1: Parsing job description with AI...');
    const parseResponse = await fetch('http://localhost:3002/api/parse-job-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: stayFinderJob.description,
        jobTitle: stayFinderJob.title,
        companyName: stayFinderJob.companyName,
        jobId: stayFinderJob.id
      })
    });

    if (!parseResponse.ok) {
      throw new Error(`Parse API failed: ${parseResponse.status} ${parseResponse.statusText}`);
    }

    const parseResult = await parseResponse.json();
    console.log('📄 Raw API Response:', JSON.stringify(parseResult, null, 2));
    
    if (!parseResult.success) {
      console.log('❌ Parse failed:', parseResult.error);
      return;
    }

    console.log('✅ Successfully parsed job description');
    const parsedSkills = parseResult.data;
    
    // Check if we got the expected data structure
    console.log('\n🔍 Checking parsed data structure:');
    console.log('- Has requiredSkills?', !!parsedSkills.requiredSkills);
    console.log('- Has learningPath?', !!parsedSkills.learningPath);
    console.log('- Has interviewPrep?', !!parsedSkills.interviewPrep);
    console.log('- Confidence:', parsedSkills.confidence);
    console.log('- Source:', parsedSkills.source);
    
    if (parsedSkills.requiredSkills) {
      console.log('\n🎯 CRITICAL SKILLS IDENTIFIED:');
      const critical = parsedSkills.requiredSkills.critical || [];
      if (critical.length > 0) {
        critical.forEach(skill => console.log(`   • ${skill}`));
      } else {
        console.log('   ⚠️ No critical skills found!');
      }
      
      console.log('\n💻 TECHNICAL SKILLS:');
      const technical = parsedSkills.requiredSkills.technical || [];
      if (technical.length > 0) {
        technical.forEach(skill => console.log(`   • ${skill}`));
      } else {
        console.log('   ⚠️ No technical skills found!');
      }
      
      console.log('\n🛠️ FRAMEWORKS:');
      const frameworks = parsedSkills.requiredSkills.frameworks || [];
      if (frameworks.length > 0) {
        frameworks.forEach(fw => console.log(`   • ${fw}`));
      } else {
        console.log('   ⚠️ No frameworks found!');
      }
      
      console.log('\n🗄️ DATABASES:');
      const databases = parsedSkills.requiredSkills.databases || [];
      if (databases.length > 0) {
        databases.forEach(db => console.log(`   • ${db}`));
      } else {
        console.log('   ⚠️ No databases found!');
      }
      
      console.log('\n💬 LANGUAGES:');
      const languages = parsedSkills.requiredSkills.languages || [];
      if (languages.length > 0) {
        languages.forEach(lang => console.log(`   • ${lang}`));
      } else {
        console.log('   ⚠️ No languages found!');
      }
    }
    
    if (parsedSkills.learningPath) {
      console.log('\n📚 LEARNING PATH:');
      const mustLearn = parsedSkills.learningPath.mustLearn || [];
      if (mustLearn.length > 0) {
        console.log('🚀 Must Learn:', mustLearn.join(', '));
      } else {
        console.log('   ⚠️ No "must learn" skills found!');
      }
      
      const highPriority = parsedSkills.learningPath.highPriority || [];
      if (highPriority.length > 0) {
        console.log('🔥 High Priority:', highPriority.join(', '));
      }
      
      console.log('⏱️ Estimated Duration:', parsedSkills.learningPath.estimatedTimeWeeks || 'N/A', 'weeks');
      console.log('📊 Difficulty Level:', parsedSkills.learningPath.difficultyLevel || 'N/A');
    }
    
    // Simulate topic generation
    console.log('\n📝 TOPICS THAT WOULD BE GENERATED:');
    let topicCount = 1;
    
    // Critical skills
    const criticalSkills = [...(parsedSkills.requiredSkills?.critical || []), ...(parsedSkills.learningPath?.mustLearn || [])];
    const uniqueCritical = [...new Set(criticalSkills)];
    
    if (uniqueCritical.length > 0) {
      console.log('\n🎯 Foundation & Critical Skills:');
      uniqueCritical.forEach(skill => {
        console.log(`   ${topicCount++}. "${skill} Fundamentals"`);
      });
    } else {
      console.log('\n⚠️ No critical skills to generate topics from!');
    }
    
    // Technical skills
    const frameworks = parsedSkills.requiredSkills?.frameworks || [];
    const languages = parsedSkills.requiredSkills?.languages || [];
    const databases = parsedSkills.requiredSkills?.databases || [];
    
    if (frameworks.length > 0) {
      console.log('\n💻 Framework Development:');
      frameworks.forEach(fw => {
        console.log(`   ${topicCount++}. "${fw} Development"`);
      });
    }
    
    if (languages.length > 0) {
      console.log('\n🔤 Language Skills:');
      languages.forEach(lang => {
        console.log(`   ${topicCount++}. "${lang} Advanced Concepts"`);
      });
    }
    
    if (databases.length > 0) {
      console.log('\n🗄️ Database Management:');
      databases.forEach(db => {
        console.log(`   ${topicCount++}. "${db} Database Management"`);
      });
    }
    
    const totalTopics = topicCount - 1;
    console.log(`\n📊 Total Topics: ${totalTopics}`);
    
    if (totalTopics === 0) {
      console.log('\n❌ PROBLEM: No topics would be generated!');
      console.log('This explains why the prep plan isn\'t showing custom content.');
      console.log('The parsing may not be extracting skills correctly from this job description.');
    } else {
      console.log('\n✅ Topics would be generated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStayFinderParsing().catch(console.error);
