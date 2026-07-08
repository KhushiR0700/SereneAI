export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  target_role: string
  university: string | null
  graduation_year: number | null
  language: string | null
  created_at: string
  updated_at: string
}

export interface InterviewSession {
  id: string
  user_id: string
  domain: string
  difficulty: string
  interview_type: string
  topic: string | null
  status: string
  started_at: string
  completed_at: string | null
  overall_score: number | null
  communication_score: number | null
  confidence_score: number | null
  technical_score: number | null
  pronunciation_score: number | null
  clarity_score: number | null
  problem_solving_score: number | null
  readiness_level: string | null
  question_count: number
  duration_seconds: number | null
  created_at: string
}

export interface SessionAnswer {
  id: string
  session_id: string
  user_id: string
  question_text: string
  question_domain: string | null
  question_difficulty: string | null
  question_type: string | null
  question_topic: string | null
  answer_text: string | null
  answer_mode: string
  follow_up_question: string | null
  model_answer: string | null
  communication_score: number | null
  confidence_score: number | null
  technical_score: number | null
  pronunciation_score: number | null
  clarity_score: number | null
  problem_solving_score: number | null
  overall_score: number | null
  ai_feedback: string | null
  voice_analysis: Record<string, unknown> | null
  timeline_annotations: TimelineAnnotation[]
  answered_at: string
  duration_seconds: number | null
}

export interface TimelineAnnotation {
  time: number
  text: string
  type: 'positive' | 'negative' | 'neutral'
}

export interface QuestionAnalysis {
  question: string
  answer_summary: string
  expected_summary: string
  model_answer: string
  strengths: string[]
  weaknesses: string[]
  missing_concepts: string[]
  keywords_used: string[]
  keywords_missed: string[]
  score: number
  domain: string
  difficulty: string
  speaking_time_seconds?: number
  ideal_speaking_time?: string
}

export interface SessionReport {
  id: string
  session_id: string
  user_id: string
  overall_summary: string | null
  strengths: string[]
  weaknesses: string[]
  communication_analysis: string | null
  technical_analysis: string | null
  confidence_analysis: string | null
  pronunciation_analysis: string | null
  areas_for_improvement: string[]
  action_plan: { action: string; detail: string }[]
  readiness_level: string | null
  recruiter_impression_score: number | null
  next_three_fixes: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[]
  // Extended fields
  question_analyses?: QuestionAnalysis[]
  top_5_improvement_areas?: string[]
  hiring_recommendation?: string
  estimated_interview_level?: string
  suggested_practice_plan?: string[]
  final_interviewer_remarks?: string
  grammar_analysis?: string
  vocabulary_analysis?: string
  problem_solving_analysis?: string
  professionalism_analysis?: string
  created_at: string
}

export interface PronunciationSession {
  id: string
  user_id: string
  word: string
  ipa_notation: string | null
  difficulty: string
  clarity_score: number | null
  word_accuracy: number | null
  problem_words: string[]
  mispronounced_words: string[]
  ai_feedback: string | null
  improvement_suggestions: string[]
  attempt_audio_url: string | null
  created_at: string
}

export interface SavedQuestion {
  id: string
  user_id: string
  question_text: string
  domain: string | null
  difficulty: string | null
  question_type: string | null
  company: string | null
  is_favorite: boolean
  practice_later: boolean
  created_at: string
}

export interface ScoreSet {
  communication: number
  confidence: number
  technical: number
  pronunciation: number
  clarity: number
  problem_solving: number
  overall: number
}

export interface FeedbackDetail {
  executive_summary: string
  strengths: string[]
  weaknesses: string[]
  missing_concepts: string[]
  missing_keywords: string[]
  keywords_used: string[]
  incorrect_statements: string[]
  what_interviewer_expected: string
  confidence_analysis: string
  communication_analysis: string
  grammar_review: string
  vocabulary_review: string
  professionalism: string
  suggested_better_answer: string
  interviewer_notes: string
  top_3_fixes: string[]
  hiring_readiness: string
  recommended_topics: string[]
  personalized_suggestions: string[]
}

export interface IdealAnswerCoverage {
  point: string
  covered: boolean
}

export interface IdealAnswer {
  full_answer: string
  why_strong: string
  short_answer: string
  common_mistakes: string[]
  interviewer_checklist: string[]
  candidate_coverage: IdealAnswerCoverage[]
}

export interface QuestionFeedback {
  scores: ScoreSet
  feedback: string
  feedback_detail?: FeedbackDetail
  score_breakdown?: ScoreBreakdown
  follow_up_question: string
  model_answer: string
  example_answer?: string
  voice_analysis?: VoiceAnalysis
  keywords_used?: string[]
  keywords_missed?: string[]
  expected_keywords?: string[]
  speaking_time_seconds?: number
  ideal_speaking_time?: string
  speaking_time_feedback?: string
  ideal_answer?: IdealAnswer | null
}

export interface ScoreBreakdown {
  score: number
  what_you_did_well: string[]
  what_was_missing: string[]
  how_to_make_90: string
}

export interface VoiceAnalysis {
  confidence: number
  clarity: number
  fluency: number
  speaking_pace: number
  energy: number
  hesitation_count: number
  filler_words: string[]
  delivery_quality: number
  feedback: string
}

export interface ReportData {
  overall_summary: string
  strengths: string[]
  weaknesses: string[]
  communication_analysis: string
  technical_analysis: string
  confidence_analysis: string
  pronunciation_analysis: string
  grammar_analysis: string
  vocabulary_analysis: string
  problem_solving_analysis: string
  professionalism_analysis: string
  areas_for_improvement: string[]
  action_plan: { action: string; detail: string }[]
  readiness_level: string
  recruiter_impression_score: number
  next_three_fixes: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[]
  question_analyses: QuestionAnalysis[]
  top_5_improvement_areas: string[]
  hiring_recommendation: string
  estimated_interview_level: string
  suggested_practice_plan: string[]
  final_interviewer_remarks: string
}

export const DOMAINS = [
  'General', 'HR', 'DSA', 'OOP', 'DBMS', 'SQL', 'Operating Systems',
  'Computer Networks', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js',
  'Express', 'MERN', 'Backend APIs', 'API Design', 'Authentication & Security',
  'Python', 'Java', 'C++', 'C', 'C#', 'Flutter', 'Blockchain', 'Cloud',
  'Docker', 'DevOps', 'System Design', 'AI/ML', 'Business Analysis', 'Product Management',
]

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const
export const INTERVIEW_TYPES = ['Technical', 'HR', 'Behavioral', 'Mixed'] as const

// Topic map: a curated set of concepts per domain used to seed unique question
// generation. The authoritative, comprehensive map lives in the generate-question
// edge function; this frontend subset powers the topic picker in the UI.
export const DOMAIN_TOPICS: Record<string, string[]> = {
  'Python': ['decorators','generators','context managers','asyncio','GIL','metaclasses','descriptors','list comprehensions','memory management','closures','type hints','dataclasses','functools','itertools','multiprocessing vs threading','pytest','error handling','magic methods','property','slots','walrus operator','pattern matching','typing module','abc','enum','collections','weakref','coroutines','event loop','futures'],
  'JavaScript': ['closures','event loop','promises','async await','prototypal inheritance','this keyword','hoisting','WeakMap and WeakSet','Proxy and Reflect','generators','destructuring','spread and rest','ES modules','service workers','web workers','memory leaks','debounce and throttle','event delegation','Symbol','Intl API','typed arrays','ArrayBuffer','fetch API','AbortController','WebSocket','structuredClone','optional chaining','nullish coalescing','template literals','private class fields'],
  'TypeScript': ['generics','conditional types','mapped types','utility types','template literal types','decorators','type guards','discriminated unions','infer keyword','variance','satisfies operator','declaration merging','module augmentation','strict mode','never type','branded types','type predicates','as const','readonly','tuple types','function overloads','interfaces vs type aliases','index signatures','literal types','enum types','union types','intersection types','narrowing','keyof','typeof','abstract classes'],
  'Java': ['garbage collection','JVM internals','Stream API','Optional','concurrency','synchronized','volatile','CompletableFuture','generics erasure','reflection','lambda expressions','method references','interfaces vs abstract classes','design patterns','Spring Boot','JUnit','JDBC vs JPA','serialization','record classes','sealed classes','pattern matching','switch expressions','text blocks','exception handling','collections framework','HashMap internals','ConcurrentHashMap','Executor framework','ForkJoinPool','locks','atomic variables'],
  'C++': ['RAII','smart pointers','move semantics','perfect forwarding','template metaprogramming','SFINAE','concepts','virtual dispatch','multiple inheritance','const correctness','undefined behavior','memory model','std::atomic','coroutines','ranges','copy elision','std::variant','std::optional','lambda captures','rule of five','STL containers','iterators','algorithms','type traits','memory management','new and delete','alignment','exception handling','concurrency','templates'],
  'C': ['pointers','pointer arithmetic','memory allocation','struct vs union','file I/O','preprocessor macros','function pointers','buffer overflow','undefined behavior','volatile','restrict','static keyword','bitwise operations','linked list','socket programming','string handling','arrays','structures','unions','enumerations','storage classes','type system','memory layout','dynamic memory','compilation','linking','makefiles','debugging','POSIX threads','processes'],
  'C#': ['async await','LINQ','delegates and events','generics','reflection','dependency injection','garbage collection','value types vs reference types','records','pattern matching','Span<T>','nullability','interfaces','extension methods','IDisposable','Task Parallel Library','Entity Framework','expression trees','async patterns','LINQ operators','collections','concurrent collections','delegates','events','attributes','memory management','nullable reference types','switch expressions','ASP.NET Core','configuration'],
  'SQL': ['window functions','CTEs','recursive CTEs','execution plans','index strategies','query optimization','joins','subqueries','transactions','ACID','locking','partitioning','stored procedures','triggers','views','normalization','denormalization','JSON functions','full-text search','isolation levels','deadlocks','MVCC','B-tree','hash index','query performance','aggregation','set operations','data types','constraints','replication'],
  'React': ['hooks','useEffect cleanup','custom hooks','context API','React.memo','lazy loading','Suspense','error boundaries','portals','concurrent mode','useTransition','useDeferredValue','server components','hydration','reconciliation','Fiber architecture','key prop','render props','compound components','controlled vs uncontrolled','forms','state management','Redux Toolkit','routing','data fetching','performance','testing','accessibility','refs','lifecycle methods'],
  'Node.js': ['event loop phases','streams','backpressure','cluster module','worker_threads','child_process','EventEmitter','Buffer','memory leaks','module system','middleware patterns','error handling','fs promises','crypto module','HTTP/2','WebSockets','caching strategies','process management','performance','async patterns','networking','security','authentication','databases','real-time','message queues','logging','testing','deployment','graceful shutdown'],
  'DSA': ['time complexity','space complexity','sliding window','two pointers','binary search variants','quicksort partitioning','merge sort','heap operations','graph traversals','Dijkstra','A* search','dynamic programming','memoization','backtracking','trie operations','segment trees','union find','topological sort','cycle detection','string algorithms','greedy algorithms','divide and conquer','bit manipulation','recursion','linked lists','stacks','queues','trees','hashing'],
  'DBMS': ['normalization forms','ACID','MVCC','indexing strategies','B-tree vs hash index','query optimization','database sharding','replication','CAP theorem','distributed transactions','OLTP vs OLAP','stored procedures','triggers','views','materialized views','connection pooling','deadlock detection','isolation levels','locks','logging','checkpointing','backup strategies','high availability','data modeling','NoSQL','PostgreSQL','MySQL','partitioning','security','performance tuning'],
  'Operating Systems': ['process scheduling','memory management','paging','segmentation','virtual memory','page replacement','file systems','I/O scheduling','deadlock prevention','semaphores','mutexes','inter-process communication','context switching','system calls','kernel vs user mode','RAID levels','memory-mapped files','process synchronization','thread models','scheduling concepts','multicore scheduling','real-time scheduling','caching','virtualization','boot process','security','networking','performance','concurrency'],
  'Computer Networks': ['TCP/IP stack','OSI model','DNS resolution','HTTP/2 vs HTTP/3','TLS handshake','BGP routing','OSPF','TCP congestion control','QUIC','NAT traversal','CDN architecture','WebSockets','HTTP headers','REST vs gRPC','load balancing','network security','firewall rules','VPN tunneling','IPv6 transition','ARP','DHCP','ICMP','switching','routing protocols','multicast','QoS','network monitoring','wireless','SDN','cloud networking'],
  'OOP': ['SOLID principles','design patterns','factory pattern','singleton','observer','strategy','decorator','composite','command','dependency injection','composition over inheritance','YAGNI DRY KISS','polymorphism types','cohesion and coupling','domain-driven design','law of Demeter','open/closed principle','Liskov substitution','interface segregation','encapsulation','inheritance','abstract classes','interfaces','method overriding','method overloading','constructors','static members','generics','immutability'],
  'System Design': ['URL shortener','chat application','rate limiter','search engine','distributed cache','event streaming','message queues','microservices','API gateway','service mesh','CQRS','event sourcing','saga pattern','circuit breaker','consistent hashing','distributed locks','leader election','read replicas','write-through vs write-behind','sharding','replication','CAP theorem','load balancing','CDN','database scaling','storage','messaging','real-time','monitoring','scalability'],
  'AI/ML': ['gradient descent','overfitting','bias variance tradeoff','cross-validation','regularization','neural network architectures','backpropagation','attention mechanism','transformers','transfer learning','RLHF','embeddings','recommendation systems','clustering','decision trees','ensemble methods','feature engineering','model evaluation','MLOps','data preprocessing','hyperparameter tuning','model interpretability','CNN','RNN','generative models','NLP','computer vision','reinforcement learning','federated learning','quantization','LoRA'],
  'Cloud': ['IaaS PaaS SaaS','auto-scaling','load balancing','CDN','serverless','containers','Kubernetes','service mesh','IAM','secrets management','cost optimization','multi-region','disaster recovery','object storage','block storage','managed databases','observability','infrastructure as code','networking','security','compute','storage tiers','databases','messaging','orchestration','edge computing','hybrid cloud','FinOps','compliance','data lakes'],
  'Docker': ['Dockerfile optimization','multi-stage builds','networking modes','volumes vs bind mounts','Docker Compose','container security','image layers','health checks','resource limits','registry management','Docker swarm','secrets management','build cache','container runtime','entrypoint vs cmd','environment variables','logging','monitoring','image distribution','container patterns','CI CD','performance','debugging','rootless Docker','networking','container storage','image registries','Dockerfile best practices','security scanning','context management'],
  'DevOps': ['CI/CD pipelines','blue-green deployment','canary releases','infrastructure as code','Terraform','Ansible','Kubernetes orchestration','Docker networking','monitoring and alerting','log aggregation','GitOps','feature flags','chaos engineering','SRE practices','SLO SLA SLI','incident management','rollback strategies','pipeline security','container security','Kubernetes security','deployment strategies','observability','automation','cloud provisioning','configuration management','release management','testing','container registries','secrets management','multi environment','disaster recovery'],
  'Git': ['branching strategies','rebase vs merge','cherry-pick','interactive rebase','git hooks','submodules','large file storage','git flow','trunk-based development','conflict resolution','stashing','bisect','reflog','squashing commits','semantic versioning','conventional commits','git internals','git config','git remote','git blame','git log','git diff','git reset','git revert','git tag','git worktree','git stash workflow','git attributes','git aliases','git gc','git filter repo'],
  'Linux': ['process management','file permissions','cron jobs','systemd','shell scripting','grep sed awk','pipe and redirection','networking commands','package management','kernel parameters','memory management','disk I/O','log management','firewall with iptables','SSH configuration','environment variables','file system hierarchy','text editors','file operations','compression','users and groups','scheduling','performance monitoring','network configuration','storage','security','containers','virtualization','kernel','boot process'],
  'HR': ['career motivation','handling conflict','strengths and weaknesses','5-year plan','teamwork examples','learning new tech','time management','receiving feedback','leadership experience','failure and lessons','why this company','salary negotiation','remote work','behavioral questions','culture fit','work life balance','ambition','communication skills','problem solving','adaptability','ownership','collaboration','mentoring','decision making','prioritization','stakeholder management','project ownership','self awareness','resilience','creativity'],
  'Behavioral': ['STAR method','cross-functional collaboration','missed deadline','technical disagreement','mentoring','project ownership','ambiguous requirements','difficult stakeholders','delivering bad news','going above and beyond','pivoting strategy','competing priorities','leading without authority','taking initiative','failure and recovery','successful project','challenging project','disagreement','tough feedback','pressure','multiple projects','mistake','difficult team member','influence','driving change','tight deadline','ambiguity','stretch project','production incident','process improvement'],
  'Aptitude': ['time and work','speed and distance','profit and loss','percentages','ratio and proportion','permutations and combinations','probability','number series','blood relations','data interpretation','logical reasoning','syllogisms','clock and calendar','averages','mixtures','simple interest','compound interest','numbers','geometry','trigonometry','statistics','set theory','logarithms','surds and indices','pipes and cisterns','races','ages','calendars','clocks','directions'],
  'General': ['debugging approach','code review','technical documentation','performance optimization','refactoring','testing strategies','technical debt','system thinking','learning approach','project management','problem solving','communication','estimation','agile practices','pair programming','mentoring','production readiness','incident response','postmortems','technical writing','API design','error handling','logging','monitoring','security basics','accessibility','internationalization','developer experience','code quality','software craftsmanship'],
  'Cloud Computing': ['serverless architecture','container orchestration','microservices','service mesh','cloud-native patterns','multi-cloud strategy','FinOps','observability','security in the cloud','edge computing','IaaS','PaaS','SaaS','public private hybrid','cloud providers','regions and zones','virtual networking','cloud storage','managed databases','cloud caching','message queues','streaming','cloud security','compliance','disaster recovery','high availability','auto scaling','load balancing','CDN','DNS','IaC'],
  'Machine Learning': ['supervised learning','unsupervised learning','reinforcement learning','deep learning','model deployment','MLOps','data preprocessing','feature selection','hyperparameter tuning','model interpretability','linear models','tree based models','SVM','k-nearest neighbors','naive Bayes','clustering','dimensionality reduction','neural network fundamentals','CNN','RNN','transformers','generative models','transfer learning','recommendation systems','NLP','computer vision','time series','anomaly detection','model evaluation','cross validation','overfitting'],
  'Flutter': ['widget tree','state management','Navigator 2.0','streams and BLoC','animations','platform channels','testing','performance profiling','internationalization','null safety','Dart language','build modes','widgets','layout','scrolling','forms','assets and images','networking','local storage','platform adaptations','responsive design','themes','navigation patterns','dependency injection','error handling','lifecycle','platform specific','pub packages','Dart isolates','Dart collections'],
  'Blockchain': ['consensus mechanisms','smart contracts','Solidity basics','gas optimization','DeFi protocols','NFT standards','layer 2 scaling','cross-chain bridges','wallet security','oracle problem','cryptography','Merkle trees','elliptic curves','zero knowledge proofs','hash functions','digital signatures','block structure','transaction lifecycle','mining and validation','staking','governance','tokens and standards','tokenomics','decentralized exchanges','automated market makers','lending protocols','yield farming','flash loans','oracles','DAOs','identity'],
  'Cyber Security': ['OWASP Top 10','SQL injection','XSS prevention','CSRF protection','JWT security','OAuth 2.0 flows','zero trust architecture','penetration testing','cryptography fundamentals','TLS configuration','container security','cloud security posture','network security','identity and access management','incident response','threat modeling','security architecture','vulnerability management','security automation','supply chain security','secrets management','encryption at rest','encryption in transit','key management','hashing algorithms','symmetric encryption','asymmetric encryption','digital signatures','PKI','authentication'],
  'HTML': ['semantic HTML','accessibility','ARIA roles','forms and validation','Canvas API','Web Components','Shadow DOM','custom elements','data attributes','meta tags','SEO fundamentals','preload and prefetch','media elements','image elements','table elements','form elements','input types','document structure','script loading','iframes','web storage','geolocation','drag and drop','contenteditable','details and summary','dialog element','popover API','search element','picture element','template element'],
  'CSS': ['flexbox','CSS Grid','specificity','cascade','custom properties','animations','transitions','media queries','container queries','CSS architecture','responsive design','performance optimization','CSS Houdini','selectors','pseudo classes','pseudo elements','box model','positioning','display','overflow','backgrounds','gradients','borders and outlines','transforms','filters','blend modes','masking','writing modes','logical properties','color spaces'],
  'Angular': ['change detection','OnPush strategy','dependency injection','lazy loading','reactive forms','template-driven forms','NgRx','HTTP interceptors','directives','pipes','zones','dynamic components','Angular Universal','lifecycle hooks','Observables','RxJS operators','subjects','routing','route guards','standalone components','signals','control flow','content projection','view queries','content queries','providers','testing','Angular CLI','schematics','internationalization'],
  'Vue': ['Composition API','reactivity system','Vuex vs Pinia','Vue Router','computed vs watch','component communication','slots','directives','async components','provide inject','Vue 3 vs Vue 2','Suspense','teleport','keep alive','lifecycle hooks','template syntax','v model','render functions','custom directives','plugins','mixins','filters','transitions','state management','Pinia','Vuex','Vue Router 4','navigation guards','lazy loading routes','scoped slots'],
  'Express': ['middleware chain','error handling middleware','routing','authentication','input validation','CORS','rate limiting','file uploads','session management','REST API design','request lifecycle','security best practices','body parsing','cookies','static files','templating','database integration','ORM patterns','query building','websockets','server sent events','long polling','testing','request logging','response formatting','content negotiation','conditional requests','range requests','streaming responses','compression'],
  'MERN': ['MongoDB','Express.js','React','Node.js','MERN stack integration','REST API in MERN','MongoDB schema design','Mongoose','aggregation pipeline','React state management','React hooks','React forms','React routing','authentication in MERN','authorization','API security','error handling','validation','file uploads','real time','pagination','filtering and sorting','deployment','environment management','testing','performance optimization','database indexing','caching strategies','security best practices','logging'],
  'Backend APIs': ['REST principles','GraphQL','gRPC','API design','authentication','authorization','rate limiting','pagination','filtering and sorting','error handling','input validation','caching','idempotency','webhooks','long polling','server sent events','websockets','API gateway','BFF pattern','API versioning','content negotiation','HATEOAS','status codes','HTTP methods','headers','cookies','CORS','security','input sanitization','output encoding'],
  'API Design': ['REST principles','resource modeling','HTTP methods','status codes','API versioning','pagination','filtering and sorting','error handling','error responses','input validation','output formatting','caching','conditional requests','idempotency','webhooks','rate limiting','authentication','authorization','CORS','security headers','input sanitization','output encoding','secrets management','TLS','GraphQL','GraphQL schema design','GraphQL resolvers','gRPC','protocol buffers'],
  'Authentication & Security': ['authentication vs authorization','password hashing','session management','JWT','OAuth 2.0','OIDC','SAML','SSO','MFA','WebAuthn','passkeys','RBAC','ABAC','PBAC','least privilege','separation of duties','credential management','secrets management','encryption at rest','encryption in transit','key management','hashing algorithms','symmetric encryption','asymmetric encryption','digital signatures','PKI','TLS','mTLS','zero trust','OWASP Top 10'],
  'Business Analysis': ['requirement gathering','BRD','FRD','use cases','user stories','acceptance criteria','stakeholder management','agile','scrum','JIRA','gap analysis','process mapping','functional vs non functional requirements','MoSCoW prioritization','wireframing','change requests','requirement traceability','business process modeling','data flow diagrams','SWOT analysis','root cause analysis','impact analysis','feasibility analysis','cost benefit analysis','KPI definition','user acceptance testing','requirements validation','elicitation techniques','interviewing stakeholders','workshop facilitation','document analysis','observation','prototyping','requirements documentation','requirements prioritization','requirements change management','traceability matrix','business rules','decision modeling','domain modeling','data dictionary','reporting requirements','integration requirements','migration requirements','security requirements','performance requirements','usability requirements','accessibility requirements','compliance requirements','regulatory requirements'],
  'Product Management': ['product lifecycle','roadmaps','KPIs','north star metrics','prioritization','product discovery','user research','A/B testing','MVP','product strategy','market analysis','stakeholder management','feature prioritization','OKRs','retention','growth metrics','customer development','value proposition','product market fit','competitive analysis','pricing strategy','go to market','product positioning','user personas','customer journey mapping','voice of customer','feedback loops','product requirements document','epics and stories','sprint planning','backlog management','release planning','beta testing','product launch','iteration','data driven decisions','funnel analysis','cohort analysis','churn analysis','activation metrics','engagement metrics','monetization','product analytics','experiment design','hypothesis testing','product validation','stakeholder communication','executive presentations','cross functional collaboration'],
}

// Structured curriculum trees with Beginner/Intermediate/Advanced levels
// These determine which topics are asked based on difficulty level
export const DOMAIN_CURRICULUM: Record<string, { beginner: string[]; intermediate: string[]; advanced: string[] }> = {
  'Python': {
    beginner: ['Variables', 'Data Types', 'Lists', 'Tuples', 'Sets', 'Dictionaries', 'Loops', 'Functions', 'Arguments', 'String Operations', 'Input/Output', 'Operators', 'Conditionals', 'Exception Basics', 'File Handling Basics'],
    intermediate: ['List Comprehensions', 'Lambda Functions', 'Modules', 'Packages', 'OOP Basics', 'Classes', 'Inheritance', 'Decorators', 'Generators', 'Context Managers', 'Error Handling Patterns', 'Regular Expressions', 'File Handling Advanced', 'Unit Testing', 'Working with JSON'],
    advanced: ['Asyncio', 'Coroutines', 'Event Loop', 'Metaclasses', 'Descriptors', 'GIL', 'Memory Management', 'Multiprocessing vs Threading', 'Closures', 'Type Hints', 'Dataclasses', 'Functools', 'Itertools', 'Magic Methods', 'Slots', 'Property Decorator'],
  },
  'JavaScript': {
    beginner: ['Variables', 'Data Types', 'Arrays', 'Objects', 'Functions', 'Loops', 'Conditionals', 'String Methods', 'Template Literals', 'Operators', 'Scope', 'DOM Basics', 'Events', 'Alert and Prompt'],
    intermediate: ['Closures', 'Prototypal Inheritance', 'this Keyword', 'Arrow Functions', 'Destructuring', 'Spread and Rest', 'Promises', 'Async Await', 'Classes', 'Modules', 'Map and Set', 'Callbacks', 'Event Loop Basics', 'Error Handling', 'Local Storage'],
    advanced: ['Event Loop Internals', 'Microtasks vs Macrotasks', 'WeakMap and WeakSet', 'Proxy and Reflect', 'Generators', 'Symbols', 'Memory Leaks', 'Web Workers', 'Service Workers', 'Typed Arrays', 'ArrayBuffer', 'WebSocket', 'Fetch API Deep Dive', 'Performance Optimization', 'Async Iterators'],
  },
  'DSA': {
    beginner: ['Array', 'String', 'Linked List', 'Stack', 'Queue', 'Time Complexity Basics', 'Space Complexity', 'Binary Search', 'Sorting Basics', 'HashMap', 'Recursion Basics', 'Two Pointers'],
    intermediate: ['Tree', 'Heap', 'Trie', 'Graph Basics', 'BFS', 'DFS', 'DP Basics', 'Memoization', 'Sliding Window', 'Prefix Sum', 'Binary Search Variants', 'Backtracking Basics', 'Greedy Basics'],
    advanced: ['Segment Tree', 'Fenwick Tree', 'Union Find', 'Dijkstra', 'Bellman-Ford', 'Advanced DP', 'Tree DP', 'Bitmask DP', 'Suffix Arrays', 'KMP', 'A* Search', 'Floyd-Warshall', 'Topological Sort Variants', 'Heavy-Light Decomposition'],
  },
  'DBMS': {
    beginner: ['Tables', 'Keys', 'SQL Basics', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WHERE', 'JOIN Basics', 'Group By', 'Order By', 'Normalization 1NF-3NF', 'Indexes Basics'],
    intermediate: ['ACID', 'Transactions', 'Isolation Levels', 'Locking', 'Stored Procedures', 'Triggers', 'Views', 'Query Optimization Basics', 'B-Tree Indexes', 'Hash Indexes', 'Normalization BCNF', 'Replication Basics'],
    advanced: ['MVCC', 'Sharding', 'CAP Theorem', 'Distributed Transactions', 'Query Optimization Advanced', 'Partitioning', 'Connection Pooling', 'Deadlock Detection', 'Recovery', 'Logging', 'Checkpointing', 'OLTP vs OLAP'],
  },
  'Operating Systems': {
    beginner: ['Process', 'Thread', 'Scheduling Basics', 'Memory Basics', 'File Systems', 'System Calls', 'Kernel vs User Mode', 'Process States', 'Context Switching', 'CPU Scheduling Basics', 'I/O Basics'],
    intermediate: ['Semaphore', 'Mutex', 'Deadlock', 'Paging', 'Segmentation', 'Virtual Memory', 'Page Replacement', 'IPC', 'Process Synchronization', 'Disk Scheduling', 'File System Implementation', 'Memory Protection'],
    advanced: ['NUMA', 'Kernel Scheduling CFS', 'Lock-free Programming', 'Memory Mapped Files', 'Copy on Write', 'Thrashing', 'Working Set', 'RAID', 'Journaling File Systems', 'Real-time Scheduling', 'Virtualization', 'Containerization'],
  },
  'Computer Networks': {
    beginner: ['OSI Model', 'TCP/IP Basics', 'HTTP', 'DNS Basics', 'IP Addressing', 'Subnetting', 'Ports', 'Protocols', 'Client-Server Model', 'Web Basics', 'Routing Basics'],
    intermediate: ['TCP Handshake', 'UDP', 'TLS Basics', 'HTTP Headers', 'Load Balancing', 'NAT', 'DHCP', 'Firewall Basics', 'VPN Basics', 'Switching', 'Routing Protocols Basics'],
    advanced: ['TCP Congestion Control', 'BGP', 'OSPF', 'QUIC', 'HTTP/2 vs HTTP/3', 'SDN', 'CDN Architecture', 'DDoS Mitigation', 'Zero Trust', 'Service Mesh', 'Network Virtualization', 'Wireless Deep Dive'],
  },
  'System Design': {
    beginner: ['Scalability Basics', 'Load Balancing Basics', 'Caching Basics', 'Database Basics', 'Monoliths', 'API Basics', 'Client-Server', 'Statelessness', 'Reliability Basics', 'Availability Basics'],
    intermediate: ['Microservices', 'API Gateway', 'Message Queues', 'Rate Limiting', 'Database Replication', 'Sharding', 'Consistent Hashing', 'Circuit Breaker', 'Idempotency', 'CQRS Basics'],
    advanced: ['Event Sourcing', 'Saga Pattern', 'Distributed Transactions', 'CAP Tradeoffs', 'Consensus Algorithms', 'Leader Election', 'Distributed Locks', 'Read Replicas', 'Write Patterns', 'Global Systems', 'Chaos Engineering'],
  },
  'React': {
    beginner: ['Components', 'JSX', 'Props', 'State Basics', 'useState', 'useEffect', 'Event Handling', 'Conditional Rendering', 'Lists and Keys', 'Forms Basics', 'Component Lifecycle'],
    intermediate: ['Custom Hooks', 'Context API', 'useReducer', 'useMemo', 'useCallback', 'React.memo', 'Error Boundaries', 'Code Splitting', 'Lazy Loading', 'Routing Basics', 'Forms Libraries'],
    advanced: ['Suspense', 'Concurrent Mode', 'useTransition', 'Server Components', 'Hydration', 'Fiber Architecture', 'Reconciliation', 'Performance Optimization', 'React Internals', 'Streaming SSR'],
  },
  'Node.js': {
    beginner: ['Modules', 'npm Basics', 'File System', 'HTTP Server', 'Express Basics', 'Routing', 'Middleware Basics', 'Error Handling', 'Async Basics', 'Package.json'],
    intermediate: ['Streams', 'Event Emitters', 'Cluster Module', 'Worker Threads', 'Child Process', 'Buffer', 'Async Patterns', 'Security Basics', 'Testing', 'Logging'],
    advanced: ['Event Loop Phases', 'Memory Management', 'Performance', 'Profiling', 'Backpressure', 'Network Programming', 'IPC', 'Native Addons', 'Process Management', 'Graceful Shutdown'],
  },
  'Java': {
    beginner: ['Syntax', 'Classes', 'Objects', 'Methods', 'Arrays', 'Loops', 'Conditionals', 'String', 'Wrapper Classes', 'Collections Basics', 'Exception Handling'],
    intermediate: ['OOP Principles', 'Interfaces', 'Abstract Classes', 'Generics', 'Collections Framework', 'Streams', 'Lambdas', 'Optional', 'Exception Advanced', 'File I/O', 'Threads Basics'],
    advanced: ['JVM Internals', 'Garbage Collection', 'Concurrency', 'Synchronized', 'Volatile', 'CompletableFuture', 'Reflection', 'Annotations', 'Module System', 'Memory Model', 'NIO'],
  },
  'SQL': {
    beginner: ['SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'JOIN Basics', 'INSERT', 'UPDATE', 'DELETE', 'Aggregate Functions', 'DISTINCT', 'ALIAS'],
    intermediate: ['Subqueries', 'CTEs', 'Window Functions', 'Indexes', 'Transactions', 'Views', 'Stored Procedures', 'Triggers', 'Data Types', 'Normalization', 'Query Plans Basics'],
    advanced: ['Query Optimization', 'Execution Plans', 'Recursive CTEs', 'Partitioning', 'Full-Text Search', 'JSON Functions', 'Isolation Levels', 'Deadlocks', 'MVCC', 'Replication', 'Sharding'],
  },
  'OOP': {
    beginner: ['Classes', 'Objects', 'Encapsulation', 'Inheritance', 'Polymorphism Basics', 'Abstraction', 'Constructors', 'Methods', 'Access Modifiers'],
    intermediate: ['Interfaces', 'Abstract Classes', 'Method Overloading', 'Method Overriding', 'Composition', 'Aggregation', 'Association', 'Design Patterns Basics', 'Coupling vs Cohesion'],
    advanced: ['SOLID Principles', 'Design Patterns', 'Dependency Injection', 'Factory Pattern', 'Singleton', 'Observer', 'Strategy', 'Decorator', 'Domain-Driven Design', 'Law of Demeter'],
  },
  'HR': {
    beginner: ['Tell me about yourself', 'Why this company', 'Strengths', 'Weaknesses', 'Career Goals', 'Teamwork', 'Motivation', 'Background'],
    intermediate: ['Conflict Resolution', 'Leadership', 'Failure Examples', 'Achievement Stories', 'Challenging Situations', 'Feedback', 'Time Management', 'Prioritization'],
    advanced: ['Complex Stakeholder Management', 'Strategic Thinking', 'Influence Without Authority', 'Executive Presence', 'Cross-Cultural Teams', 'Crisis Management', 'Vision Communication'],
  },
  'Behavioral': {
    beginner: ['Situation-Task-Action-Result', 'Basic teamwork examples', 'Simple challenges', 'Learning experiences', 'Basic conflict'],
    intermediate: ['Complex projects', 'Multiple stakeholders', 'Ambiguous situations', 'Leadership moments', 'Difficult decisions', 'Mentoring experiences'],
    advanced: ['Critical incidents', 'High-stakes decisions', 'Organizational change', 'Crisis situations', 'Cross-functional leadership', 'Executive interactions'],
  },
  'General': {
    beginner: ['Problem Solving Approach', 'Code Review Basics', 'Debugging Basics', 'Testing Basics', 'Documentation', 'Version Control Basics'],
    intermediate: ['Technical Debt', 'Refactoring', 'Performance Basics', 'Security Basics', 'Code Quality', 'API Design Basics'],
    advanced: ['System Thinking', 'Architecture Decisions', 'Technical Leadership', 'Mentoring', 'Continuous Improvement', 'Engineering Culture'],
  },
  'AI/ML': {
    beginner: ['Supervised Learning', 'Unsupervised Learning', 'Regression', 'Classification', 'Basic Algorithms', 'Train/Test Split', 'Overfitting Basics'],
    intermediate: ['Cross-Validation', 'Feature Engineering', 'Ensemble Methods', 'Neural Networks Basics', 'CNN Basics', 'NLP Basics', 'Model Evaluation'],
    advanced: ['Transformers', 'Attention Mechanism', 'Transfer Learning', 'RLHF', 'MLOps', 'Model Deployment', 'Quantization', 'LoRA'],
  },
  'Cloud': {
    beginner: ['IaaS/PaaS/SaaS', 'Regions/Zones', 'Compute Basics', 'Storage Basics', 'Networking Basics', 'Security Basics', 'Billing Basics'],
    intermediate: ['Kubernetes', 'Docker', 'CI/CD', 'Monitoring', 'Load Balancing', 'Auto-scaling', 'Serverless'],
    advanced: ['Service Mesh', 'Multi-region', 'Chaos Engineering', 'FinOps', 'Zero Trust', 'Edge Computing', 'Disaster Recovery'],
  },
  'DevOps': {
    beginner: ['CI/CD Basics', 'Git Basics', 'Docker Basics', 'Build Automation', 'Testing Automation', 'Deployment Basics'],
    intermediate: ['Kubernetes', 'Infrastructure as Code', 'Terraform', 'Monitoring', 'Log Aggregation', 'Feature Flags'],
    advanced: ['GitOps', 'Chaos Engineering', 'SRE Practices', 'Platform Engineering', 'Supply Chain Security', 'Multi-Cloud'],
  },
  'Business Analysis': {
    beginner: ['Requirement Gathering Basics', 'User Stories', 'Acceptance Criteria', 'Stakeholder Identification', 'Documentation Basics', 'Meeting Notes', 'Use Cases Basics', 'Agile Basics', 'Scrum Ceremonies', 'JIRA Basics'],
    intermediate: ['BRD', 'FRD', 'Gap Analysis', 'Process Mapping', 'MoSCoW Prioritization', 'Wireframing', 'Change Requests', 'Requirements Validation', 'Traceability Matrix', 'Elicitation Techniques'],
    advanced: ['Business Process Modeling', 'Data Flow Diagrams', 'Root Cause Analysis', 'Impact Analysis', 'Feasibility Analysis', 'Cost Benefit Analysis', 'Strategic Planning', 'Digital Transformation', 'Enterprise Analysis', 'Business Architecture'],
  },
  'Product Management': {
    beginner: ['Product Lifecycle Basics', 'User Stories', 'Backlog Management', 'Sprint Planning', 'Customer Feedback', 'Market Research Basics', 'Competitor Analysis', 'KPIs Basics', 'MVP Concept', 'Product Positioning'],
    intermediate: ['Roadmaps', 'A/B Testing', 'User Personas', 'Customer Journey Mapping', 'Feature Prioritization', 'OKRs', 'Retention Metrics', 'Growth Metrics', 'Product Analytics', 'Stakeholder Management'],
    advanced: ['North Star Metrics', 'Product Market Fit', 'Go-to-Market Strategy', 'Pricing Strategy', 'Cohort Analysis', 'Churn Analysis', 'Monetization Strategy', 'Experiment Design', 'Product Strategy', 'Executive Presentations'],
  },
}

export function getTopicsForDomain(domain: string): string[] {
  return DOMAIN_TOPICS[domain] || []
}

export function getTopicsForDomainAndDifficulty(domain: string, difficulty: string): string[] {
  const curriculum = DOMAIN_CURRICULUM[domain]
  if (!curriculum) return DOMAIN_TOPICS[domain] || []

  if (difficulty === 'Easy') return curriculum.beginner
  if (difficulty === 'Medium') return [...curriculum.beginner, ...curriculum.intermediate]
  return [...curriculum.intermediate, ...curriculum.advanced]
}

export function getReadinessLevel(score: number): string {
  if (score >= 85) return 'Excellent Candidate'
  if (score >= 70) return 'Strong Candidate'
  if (score >= 55) return 'Interview Ready'
  if (score >= 40) return 'Developing'
  return 'Beginner'
}
