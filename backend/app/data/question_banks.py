# Question bank for SereneAI

QUESTION_BANK = []

def add_q(category, topic, difficulty, length, style, question_text, skill="Technical Knowledge"):
    global QUESTION_BANK
    q_id = f"{category.lower()}_{len(QUESTION_BANK)}"
    QUESTION_BANK.append({
        "id": q_id,
        "category": category,
        "topic": topic,
        "difficulty": difficulty,
        "skill_tested": skill,
        "question_length": length,
        "style": style,
        "question": question_text
    })

# --- HR Questions (30-40) ---
hr_qs = [
    ("Introduction", "easy", "short", "basic", "Tell me a little about yourself outside of what's on your resume."),
    ("Introduction", "easy", "medium", "real_world", "How would your friends or colleagues describe your working style?"),
    ("Goals", "medium", "medium", "basic", "Where do you see your career heading in the next 3 to 5 years?"),
    ("Goals", "medium", "medium", "real_world", "What are you looking for in your next role that you didn't have in your last?"),
    ("Goals", "hard", "deep", "scenario", "Imagine you achieve all your short-term career goals. What is the ultimate dream role for you?"),
    ("Strengths/Weaknesses", "easy", "short", "basic", "What do you consider your greatest professional strength?"),
    ("Strengths/Weaknesses", "medium", "medium", "counter", "You mentioned that strength, but how has it ever been a disadvantage for you?"),
    ("Strengths/Weaknesses", "medium", "medium", "real_world", "Tell me about a weakness you actively worked on improving recently."),
    ("Strengths/Weaknesses", "hard", "deep", "scenario", "If your manager gave you constructive feedback you disagreed with, how would you handle it?"),
    ("Teamwork", "medium", "medium", "basic", "Do you prefer working independently or as part of a team, and why?"),
    ("Teamwork", "medium", "deep", "scenario", "Describe a time when a team member was not pulling their weight. How did you address it?"),
    ("Teamwork", "hard", "deep", "project_based", "Tell me about a project where you had to collaborate with someone whose personality clashed with yours."),
    ("Adaptability", "medium", "medium", "real_world", "Describe a situation where you had to quickly adapt to a significant change at work or school."),
    ("Adaptability", "hard", "deep", "scenario", "You are given a task with a tool you've never used before and a tight deadline. What is your approach?"),
    ("Conflict Resolution", "hard", "deep", "scenario", "Tell me about a time you had a disagreement with a superior. How was it resolved?"),
    ("Conflict Resolution", "medium", "medium", "basic", "How do you handle criticism of your work?"),
    ("Leadership", "medium", "medium", "basic", "Can you give an example of a time you took initiative on a project?"),
    ("Leadership", "hard", "deep", "scenario", "You are put in charge of a failing project. What are your first three steps?"),
    ("Failure", "hard", "deep", "real_world", "Tell me about a time you made a significant mistake. What happened and how did you recover?"),
    ("Failure", "medium", "medium", "counter", "Following up on that mistake, what specific process did you change to ensure it never happened again?"),
    ("Company Fit", "easy", "short", "basic", "Why do you want to work for our company?"),
    ("Company Fit", "medium", "medium", "real_world", "What values are most important to you in a workplace culture?"),
    ("Motivation", "easy", "short", "basic", "What gets you excited to wake up and work every day?"),
    ("Motivation", "medium", "medium", "real_world", "Describe a project that you were truly passionate about."),
    ("Time Management", "medium", "medium", "basic", "How do you prioritize your tasks when you have multiple deadlines?"),
    ("Time Management", "hard", "deep", "scenario", "You have three urgent tasks due today but only time to finish two. How do you decide?"),
    ("Diversity", "medium", "medium", "real_world", "How do you ensure you are being inclusive when working in a diverse team?"),
    ("Learning", "easy", "short", "basic", "How do you keep your skills sharp and stay updated with industry trends?"),
    ("Learning", "medium", "medium", "project_based", "Tell me about a time you had to learn a complex topic quickly for a project."),
    ("Salary/Logistics", "medium", "short", "basic", "What are your salary expectations for this role?"),
    ("Closing", "easy", "short", "basic", "Do you have any questions for me about the role or the company?")
]
for t, d, l, s, q in hr_qs:
    add_q("HR", t, d, l, s, q, "Communication")

# --- Behavioral Questions ---
beh_qs = [
    ("Problem Solving", "medium", "deep", "scenario", "Describe a time when you found a creative solution to a difficult problem."),
    ("Decision Making", "hard", "deep", "real_world", "Tell me about a time you had to make a decision without all the necessary information."),
    ("Stress Management", "medium", "medium", "basic", "How do you handle working under tight pressure or stressful conditions?"),
    ("Ethics", "hard", "deep", "scenario", "What would you do if you saw a colleague doing something unethical?"),
    ("Communication", "medium", "deep", "project_based", "Tell me about a time you had to explain a complex technical concept to a non-technical person.")
]
for t, d, l, s, q in beh_qs:
    add_q("Behavioral", t, d, l, s, q, "Communication")

# --- Project Questions ---
proj_qs = [
    ("Architecture", "medium", "medium", "project_based", "Can you walk me through the architecture of your most recent project?"),
    ("Architecture", "hard", "deep", "counter", "Why did you choose that specific architecture? What were the alternatives you considered?"),
    ("Tech Stack", "medium", "short", "project_based", "What technologies did you use for the backend, and why?"),
    ("Tech Stack", "hard", "medium", "counter", "If you had to rebuild that project today, what technology stack would you change?"),
    ("Challenges", "medium", "deep", "real_world", "What was the most challenging technical hurdle you faced in your project and how did you solve it?"),
    ("Challenges", "hard", "deep", "counter", "Did that solution introduce any performance bottlenecks? How did you test it?"),
    ("Database", "medium", "medium", "project_based", "Explain the database schema you designed for your application."),
    ("Deployment", "medium", "medium", "project_based", "How did you deploy your project, and what CI/CD processes did you use?"),
    ("Impact", "medium", "short", "project_based", "What was the core problem your project was trying to solve, and did it succeed?")
]
for t, d, l, s, q in proj_qs:
    add_q("Project", t, d, l, s, q, "Project Experience")

# --- Pressure Questions ---
press_qs = [
    ("Experience", "medium", "medium", "counter", "Your resume doesn't show much practical experience. Why should we trust you with this role?"),
    ("Grades", "medium", "medium", "counter", "Your grades in core subjects aren't the highest. Does that reflect your technical ability?"),
    ("Knowledge Gap", "hard", "medium", "scenario", "We use a technology stack you have zero experience in. Why shouldn't we hire someone who already knows it?"),
    ("Mistakes", "hard", "deep", "real_world", "Tell me about a time you completely failed and disappointed your team or manager."),
    ("Loyalty", "medium", "short", "counter", "How do we know you won't leave us for a better offer in 6 months?")
]
for t, d, l, s, q in press_qs:
    add_q("Pressure", t, d, l, s, q, "Stress Tolerance")

# --- Must-have Questions ---
must_qs = [
    ("Introduction", "easy", "short", "basic", "Please introduce yourself and highlight your most relevant experience."),
    ("Company Fit", "easy", "short", "basic", "Why are you interested in this specific position?"),
    ("Strengths", "easy", "short", "basic", "What is your biggest strength?"),
    ("Weaknesses", "medium", "medium", "basic", "What is a professional weakness you are currently trying to overcome?"),
    ("Closing", "easy", "short", "basic", "Is there anything else you would like us to know about you?")
]
for t, d, l, s, q in must_qs:
    add_q("Must-have Questions", t, d, l, s, q, "Communication")

# --- Technical Questions (OOP, DBMS/SQL, OS/CN, Web, Backend/APIs, Cloud/DevOps, Mobile, Blockchain) ---
tech_qs = [
    # OOP
    ("OOP", "easy", "short", "basic", "What are the four main principles of Object-Oriented Programming?"),
    ("OOP", "medium", "medium", "real_world", "Can you explain Polymorphism with a real-world analogy?"),
    ("OOP", "medium", "medium", "implementation", "How do you achieve Encapsulation in a class, regardless of the language?"),
    ("OOP", "hard", "deep", "scenario", "You need to design a parking lot system. What base classes and interfaces would you create?"),
    ("OOP", "medium", "short", "basic", "What is the difference between an Abstract Class and an Interface?"),
    ("OOP", "hard", "medium", "counter", "If interfaces only declare methods, when would you absolutely choose an abstract class instead?"),
    ("OOP", "easy", "short", "basic", "What is inheritance?"),
    ("OOP", "medium", "medium", "implementation", "Explain the concept of method overriding versus method overloading."),
    ("OOP", "hard", "medium", "scenario", "How does multiple inheritance cause the 'Diamond Problem', and how is it resolved in modern languages?"),
    ("OOP", "medium", "short", "basic", "What is the 'this' or 'self' keyword used for in OOP?"),
    
    # DBMS / SQL
    ("DBMS/SQL", "easy", "short", "basic", "What is a Primary Key and how does it differ from a Unique Key?"),
    ("DBMS/SQL", "medium", "medium", "real_world", "Why do we normalize databases, and what are the trade-offs?"),
    ("DBMS/SQL", "medium", "medium", "implementation", "Explain the difference between an INNER JOIN and a LEFT JOIN."),
    ("DBMS/SQL", "hard", "deep", "scenario", "Your database query is running very slowly. What are the first three things you check?"),
    ("DBMS/SQL", "medium", "short", "basic", "What are ACID properties in a database transaction?"),
    ("DBMS/SQL", "hard", "medium", "counter", "If you need extremely fast reads and don't care about strict consistency, would you still use a relational DB?"),
    ("DBMS/SQL", "easy", "short", "basic", "What is an index in a database?"),
    ("DBMS/SQL", "medium", "medium", "implementation", "Write or explain a SQL query to find the second highest salary in an employee table."),
    ("DBMS/SQL", "medium", "short", "basic", "What is the difference between DDL and DML commands?"),
    ("DBMS/SQL", "hard", "medium", "scenario", "How do you handle database migrations in a production environment without downtime?"),
    ("DBMS/SQL", "medium", "medium", "implementation", "What is the difference between a clustered and a non-clustered index?"),
    ("DBMS/SQL", "hard", "deep", "scenario", "Explain how connection pooling works and why it is important for backend applications."),

    # OS / CN
    ("OS/CN", "easy", "short", "basic", "What is the difference between a process and a thread?"),
    ("OS/CN", "medium", "medium", "real_world", "How does an operating system manage deadlocks?"),
    ("OS/CN", "medium", "short", "basic", "What is virtual memory and why is it used?"),
    ("OS/CN", "hard", "medium", "scenario", "If your server is experiencing high CPU usage, what OS tools would you use to diagnose it?"),
    ("OS/CN", "easy", "short", "basic", "What happens step-by-step when you type a URL into a browser?"),
    ("OS/CN", "medium", "medium", "implementation", "Explain the difference between TCP and UDP protocols."),
    ("OS/CN", "hard", "medium", "counter", "If UDP is unreliable, why is it used for video streaming instead of TCP?"),
    ("OS/CN", "medium", "short", "basic", "What is the purpose of the OSI model?"),
    ("OS/CN", "medium", "medium", "real_world", "How does a router differ from a switch?"),
    ("OS/CN", "hard", "deep", "scenario", "Explain how DNS resolution works. What happens if the DNS server is down?"),
    ("OS/CN", "medium", "medium", "implementation", "What is a subnet mask and how does it divide a network?"),

    # Web (HTML, CSS, JS, React, MERN)
    ("Web", "easy", "short", "basic", "What is the DOM in web development?"),
    ("Web", "medium", "medium", "implementation", "Explain event delegation in JavaScript and why it is useful."),
    ("Web", "medium", "short", "basic", "What is the difference between block and inline elements in CSS?"),
    ("Web", "hard", "medium", "scenario", "Your React application is rendering too slowly. How do you optimize it?"),
    ("Web", "easy", "short", "basic", "What are React Hooks? Can you name a few?"),
    ("Web", "medium", "medium", "real_world", "How do you manage global state in a large frontend application?"),
    ("Web", "hard", "medium", "counter", "If you are using Redux, when would it be a bad idea to put state into the Redux store?"),
    ("Web", "medium", "medium", "implementation", "What is CORS, and how do you resolve CORS errors?"),
    ("Web", "medium", "short", "basic", "Explain the concept of closures in JavaScript."),
    ("Web", "hard", "deep", "scenario", "How would you implement a 'Remember Me' feature securely on the frontend?"),
    ("Web", "medium", "medium", "implementation", "What are promises in JavaScript, and how do they differ from callbacks?"),
    ("Web", "medium", "medium", "real_world", "Explain the concept of the Virtual DOM and why React uses it."),
    ("Web", "hard", "medium", "implementation", "What is Server-Side Rendering (SSR) and how does it compare to Client-Side Rendering (CSR)?"),

    # Backend / APIs
    ("Backend/APIs", "easy", "short", "basic", "What makes an API RESTful?"),
    ("Backend/APIs", "medium", "medium", "implementation", "Explain the difference between POST, PUT, and PATCH HTTP methods."),
    ("Backend/APIs", "medium", "short", "basic", "What are HTTP status codes? Give examples of 200, 400, and 500 levels."),
    ("Backend/APIs", "hard", "medium", "scenario", "How do you secure a public-facing API from malicious attacks?"),
    ("Backend/APIs", "medium", "medium", "real_world", "Explain how JWT (JSON Web Tokens) work for authentication."),
    ("Backend/APIs", "hard", "deep", "counter", "If a JWT is stolen, how can you invalidate it before it expires?"),
    ("Backend/APIs", "easy", "short", "basic", "What is the purpose of middleware in a backend framework?"),
    ("Backend/APIs", "medium", "medium", "project_based", "How did you structure the routes and controllers in your last backend project?"),
    ("Backend/APIs", "hard", "deep", "scenario", "Your API is being overwhelmed by too many requests. How do you implement rate limiting?"),
    ("Backend/APIs", "medium", "medium", "implementation", "What is GraphQL, and how does it differ from REST?"),
    ("Backend/APIs", "medium", "short", "basic", "What is the purpose of a reverse proxy like Nginx?"),

    # Cloud / DevOps
    ("Cloud/DevOps", "easy", "short", "basic", "What is Docker and why is it used?"),
    ("Cloud/DevOps", "medium", "medium", "implementation", "What is the difference between a Docker image and a container?"),
    ("Cloud/DevOps", "medium", "short", "basic", "What does CI/CD stand for?"),
    ("Cloud/DevOps", "hard", "medium", "scenario", "Walk me through the pipeline of deploying code from a GitHub push to production."),
    ("Cloud/DevOps", "easy", "short", "basic", "What are the benefits of using a cloud provider like AWS or Azure over on-premise servers?"),
    ("Cloud/DevOps", "medium", "medium", "real_world", "Explain the concept of Serverless computing."),
    ("Cloud/DevOps", "hard", "deep", "counter", "If Serverless scales infinitely, what are the potential downsides of using it?"),
    ("Cloud/DevOps", "medium", "medium", "implementation", "What is Kubernetes and when would you need it instead of just Docker?"),
    ("Cloud/DevOps", "medium", "short", "basic", "What is Infrastructure as Code (IaC)?"),

    # Mobile (Flutter/General)
    ("Mobile", "easy", "short", "basic", "What is the difference between cross-platform and native mobile development?"),
    ("Mobile", "medium", "medium", "implementation", "Explain the widget tree concept in Flutter or UI trees in general mobile dev."),
    ("Mobile", "medium", "short", "basic", "How do you manage state in a mobile application?"),
    ("Mobile", "hard", "medium", "scenario", "How would you handle local data persistence if the user loses internet connection?"),
    ("Mobile", "hard", "deep", "counter", "Cross-platform tools are fast to build with, but when would you strictly choose Native instead?"),

    # Blockchain Basics
    ("Blockchain", "easy", "short", "basic", "What is a Blockchain in simple terms?"),
    ("Blockchain", "medium", "medium", "implementation", "How does a smart contract work?"),
    ("Blockchain", "medium", "short", "basic", "What is the difference between Proof of Work and Proof of Stake?"),
    ("Blockchain", "hard", "medium", "scenario", "If data on a blockchain is immutable, how do you handle a bug in a deployed smart contract?"),
    ("Blockchain", "medium", "medium", "real_world", "What is decentralization and why is it important in Web3?")
]
for t, d, l, s, q in tech_qs:
    add_q("Technical", t, d, l, s, q, "Technical Knowledge")

def get_question_bank():
    return QUESTION_BANK
