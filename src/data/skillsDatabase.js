/**
 * Comprehensive technology skills database with categories
 * Used for the LinkedIn-style skills editor
 */

// Define categories
const CATEGORIES = {
  PROGRAMMING_LANGUAGES: 'Programming Languages',
  FRONTEND: 'Frontend Development',
  BACKEND: 'Backend Development',
  DATABASE: 'Database Technologies',
  DEVOPS: 'DevOps & Infrastructure',
  CLOUD: 'Cloud Platforms',
  MOBILE: 'Mobile Development',
  DATA_SCIENCE: 'Data Science & ML',
  DESIGN: 'Design & UX',
  PROJECT_MANAGEMENT: 'Project Management',
  TESTING: 'Testing & QA',
  SECURITY: 'Security',
  FRAMEWORKS: 'Frameworks & Libraries',
  OTHER: 'Other Skills'
};

// Define a list of popular skills to show by default
export const POPULAR_SKILLS = [
  'JavaScript', 'React', 'Python', 'SQL', 'Java', 
  'AWS', 'Node.js', 'TypeScript', 'Git', 'Docker', 
  'HTML', 'CSS', 'Angular', 'Vue.js', 'C#'
];

// Define all skills by category
const SKILLS_BY_CATEGORY = {
  [CATEGORIES.PROGRAMMING_LANGUAGES]: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C',
    'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'R', 'Scala',
    'Perl', 'Haskell', 'Clojure', 'Elixir', 'Dart', 'Groovy',
    'Objective-C', 'Assembly', 'COBOL', 'Fortran', 'Lua', 'Julia',
    'Shell Scripting', 'PowerShell', 'Bash', 'VBA'
  ],
  [CATEGORIES.FRONTEND]: [
    'HTML', 'CSS', 'SCSS/SASS', 'JavaScript', 'TypeScript', 'React',
    'Angular', 'Vue.js', 'Svelte', 'Redux', 'MobX', 'jQuery',
    'Bootstrap', 'Tailwind CSS', 'Material UI', 'Chakra UI', 'Styled Components',
    'Emotion', 'Next.js', 'Gatsby', 'Webpack', 'Vite', 'Babel',
    'ESLint', 'Prettier', 'Jest', 'React Testing Library', 'Cypress',
    'Web Components', 'Progressive Web Apps', 'Single Page Applications'
  ],
  [CATEGORIES.BACKEND]: [
    'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel',
    'Ruby on Rails', 'ASP.NET Core', 'FastAPI', 'Nest.js', 'Phoenix',
    'GraphQL', 'REST API', 'gRPC', 'WebSockets', 'Microservices',
    'Serverless', 'Message Queues', 'RabbitMQ', 'Kafka', 'Redis',
    'OAuth', 'JWT', 'API Gateway', 'Service Mesh', 'Socket.io',
    'Deno', 'Bun'
  ],
  [CATEGORIES.DATABASE]: [
    'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'Microsoft SQL Server', 'Oracle',
    'MongoDB', 'Cassandra', 'Redis', 'Elasticsearch', 'DynamoDB',
    'Firebase Firestore', 'Supabase', 'Neo4j', 'CouchDB', 'MariaDB',
    'Amazon RDS', 'Google Cloud SQL', 'Azure SQL Database', 'InfluxDB',
    'Prisma', 'Sequelize', 'TypeORM', 'Mongoose', 'Knex.js', 'SQLAlchemy'
  ],
  [CATEGORIES.DEVOPS]: [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'CI/CD', 'Jenkins',
    'GitHub Actions', 'GitLab CI/CD', 'CircleCI', 'Travis CI', 'Docker',
    'Kubernetes', 'Terraform', 'Ansible', 'Puppet', 'Chef', 'Vagrant',
    'Prometheus', 'Grafana', 'ELK Stack', 'Log Management', 'Nagios',
    'Datadog', 'New Relic', 'Rollbar', 'Sentry', 'ArgoCD'
  ],
  [CATEGORIES.CLOUD]: [
    'AWS', 'Microsoft Azure', 'Google Cloud Platform', 'Heroku', 'Digital Ocean',
    'Netlify', 'Vercel', 'Firebase', 'Cloudflare', 'Linode', 'IBM Cloud',
    'Oracle Cloud', 'AWS Lambda', 'Azure Functions', 'Google Cloud Functions',
    'S3', 'EC2', 'RDS', 'CloudFront', 'Route 53', 'IAM', 'Cognito',
    'Azure DevOps', 'GKE', 'EKS', 'AKS'
  ],
  [CATEGORIES.MOBILE]: [
    'iOS Development', 'Android Development', 'React Native', 'Flutter', 'Swift',
    'Kotlin', 'Objective-C', 'SwiftUI', 'Jetpack Compose', 'Xamarin',
    'Ionic', 'Capacitor', 'Mobile UI/UX', 'App Store Optimization',
    'Google Play Store', 'Mobile Analytics', 'Mobile Testing', 'PhoneGap',
    'Cordova', 'Unity Mobile', 'ARKit', 'ARCore', 'Push Notifications'
  ],
  [CATEGORIES.DATA_SCIENCE]: [
    'Python', 'R', 'Data Analysis', 'Data Visualization', 'Machine Learning',
    'Deep Learning', 'Natural Language Processing', 'Computer Vision',
    'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy',
    'Matplotlib', 'Seaborn', 'Tableau', 'Power BI', 'Jupyter', 'SAS',
    'SPSS', 'Big Data', 'Hadoop', 'Spark', 'ETL', 'Data Mining',
    'Statistics', 'A/B Testing', 'Reinforcement Learning'
  ],
  [CATEGORIES.DESIGN]: [
    'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Sketch',
    'InVision', 'Photoshop', 'Illustrator', 'User Research',
    'Wireframing', 'Prototyping', 'Design Systems', 'Responsive Design',
    'Accessibility (a11y)', 'WCAG Guidelines', 'Typography', 'Color Theory',
    'Design Thinking', 'User Testing', 'Zeplin'
  ],
  [CATEGORIES.PROJECT_MANAGEMENT]: [
    'Agile', 'Scrum', 'Kanban', 'Waterfall', 'Jira', 'Confluence',
    'Trello', 'Asana', 'Project Planning', 'Team Leadership',
    'Risk Management', 'Stakeholder Management', 'PRINCE2',
    'PMI', 'PMP Certification', 'Roadmapping', 'Sprint Planning',
    'Monday.com', 'ClickUp', 'Microsoft Project', 'Basecamp'
  ],
  [CATEGORIES.TESTING]: [
    'Manual Testing', 'Automated Testing', 'Test Planning', 'QA',
    'Selenium', 'Cypress', 'Jest', 'Mocha', 'Chai', 'JUnit',
    'TestNG', 'NUnit', 'Load Testing', 'Performance Testing',
    'Security Testing', 'Penetration Testing', 'API Testing',
    'UI Testing', 'End-to-End Testing', 'Integration Testing',
    'Unit Testing', 'Regression Testing', 'TestRail', 'JIRA QA'
  ],
  [CATEGORIES.SECURITY]: [
    'Cybersecurity', 'Network Security', 'OWASP', 'Penetration Testing',
    'Security Auditing', 'Encryption', 'Authentication', 'Authorization',
    'OAuth', 'JWT', 'Single Sign-On', 'Two-Factor Authentication',
    'Firewalls', 'VPN', 'Intrusion Detection', 'Security Compliance',
    'GDPR', 'HIPAA', 'PCI DSS', 'ISO 27001', 'Security Frameworks'
  ],
  [CATEGORIES.FRAMEWORKS]: [
    'React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js',
    'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel',
    'Ruby on Rails', 'ASP.NET Core', 'FastAPI', 'Nest.js', 'Phoenix',
    'Symfony', 'CodeIgniter', 'Strapi', 'Gatsby', 'Flutter',
    'React Native', 'Ionic', 'Xamarin', 'TensorFlow', 'PyTorch'
  ],
  [CATEGORIES.OTHER]: [
    'Technical Writing', 'Communication', 'Blockchain', 'Smart Contracts',
    'Ethereum', 'Solidity', 'NFTs', 'AR/VR', 'Game Development',
    'Unity', 'Unreal Engine', 'IoT', 'Embedded Systems', 'Robotics',
    'Technical SEO', 'Growth Hacking', 'Digital Marketing', 'Content Management Systems',
    'WordPress', 'Drupal', 'Technical Leadership', 'Mentoring',
    'Public Speaking', 'Code Reviews', 'Technical Architecture'
  ]
};

// Generate a flat list of all skills
const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).reduce(
  (all, categorySkills) => [...all, ...categorySkills], 
  []
);

// Search for skills matching the query string
export const searchSkills = (query, limit = 10) => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Return empty array for empty query
  if (!normalizedQuery) return [];
  
  // Filter skills that contain the query string
  const matches = ALL_SKILLS.filter(skill => 
    skill.toLowerCase().includes(normalizedQuery)
  );
  
  // Sort results: exact matches first, then by starting with query, then alphabetically
  const sortedMatches = matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Exact match gets highest priority
    if (aLower === normalizedQuery && bLower !== normalizedQuery) return -1;
    if (bLower === normalizedQuery && aLower !== normalizedQuery) return 1;
    
    // Starting with query gets next priority
    if (aLower.startsWith(normalizedQuery) && !bLower.startsWith(normalizedQuery)) return -1;
    if (bLower.startsWith(normalizedQuery) && !aLower.startsWith(normalizedQuery)) return 1;
    
    // Fall back to alphabetical order
    return a.localeCompare(b);
  });
  
  // Limit results if needed
  return sortedMatches.slice(0, limit);
};

// Get all available categories
export const getCategories = () => {
  return Object.values(CATEGORIES);
};

// Get skills for a specific category
export const getSkillsByCategory = (category) => {
  if (category === 'Popular') {
    return POPULAR_SKILLS;
  }
  
  return SKILLS_BY_CATEGORY[category] || [];
};

// Export the categories constant for use elsewhere
export { CATEGORIES };