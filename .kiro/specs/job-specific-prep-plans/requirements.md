# Requirements Document

## Introduction

The current prep plan generation system is producing generic learning topics instead of job-specific, targeted learning plans. Users expect personalized prep plans that directly address the gaps between their current skills and the specific job requirements they're applying for. The system should analyze the job description, compare it with the user's profile/resume, and generate highly targeted learning recommendations.

## Requirements

### Requirement 1

**User Story:** As a job seeker, I want my prep plan to be specifically tailored to the job I'm applying for, so that I can focus my limited study time on the most relevant skills.

#### Acceptance Criteria

1. WHEN a user generates a prep plan THEN the system SHALL analyze the specific job description and requirements
2. WHEN the job description contains specific technologies or skills THEN the prep plan SHALL prioritize those exact technologies
3. WHEN the job description mentions specific frameworks or tools THEN the prep plan SHALL include learning paths for those specific frameworks
4. IF the job requires "React and Node.js" THEN the prep plan SHALL focus on React and Node.js, not generic "web development"

### Requirement 2

**User Story:** As a job seeker, I want the prep plan to identify the exact gaps between my current skills and the job requirements, so that I don't waste time learning things I already know.

#### Acceptance Criteria

1. WHEN the system has access to resume analysis data THEN it SHALL use that data to identify specific skill gaps
2. WHEN a user already has experience with a technology mentioned in the job THEN the prep plan SHALL focus on advancing that skill rather than starting from basics
3. WHEN a user is completely missing a required skill THEN the prep plan SHALL prioritize that skill as critical
4. IF the resume analysis fails THEN the system SHALL still extract job-specific requirements from the job description

### Requirement 3

**User Story:** As a job seeker, I want the prep plan to be based on the actual job posting content, so that I'm preparing for the real requirements of the position.

#### Acceptance Criteria

1. WHEN generating a prep plan THEN the system SHALL extract specific skills, technologies, and requirements from the job description text
2. WHEN the job description mentions specific experience levels THEN the prep plan SHALL target that experience level
3. WHEN the job description includes company-specific technologies THEN the prep plan SHALL include those technologies
4. WHEN the AI API fails THEN the fallback system SHALL still generate job-specific content based on job description analysis

### Requirement 4

**User Story:** As a job seeker, I want to see why each topic was included in my prep plan, so that I understand the relevance to my target job.

#### Acceptance Criteria

1. WHEN a topic is included in the prep plan THEN the system SHALL explain why it's needed for the specific job
2. WHEN a skill is marked as "missing" THEN the system SHALL indicate it was found in the job requirements but not in the user's profile
3. WHEN a skill is marked as "to improve" THEN the system SHALL explain the gap between current level and job requirements
4. WHEN displaying prep plan topics THEN each topic SHALL include a "whyNeeded" explanation specific to the job

### Requirement 5

**User Story:** As a job seeker, I want the prep plan to work reliably even when AI services are unavailable, so that I can always get job-specific recommendations.

#### Acceptance Criteria

1. WHEN the AI API is unavailable THEN the system SHALL generate a job-specific fallback plan
2. WHEN the AI response is invalid THEN the system SHALL parse job requirements and generate targeted recommendations
3. WHEN resume analysis data is missing THEN the system SHALL perform keyword-based gap analysis using the job description
4. WHEN all AI services fail THEN the fallback plan SHALL still be more specific than generic programming topics