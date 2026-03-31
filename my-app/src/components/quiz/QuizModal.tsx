// ─── components/quiz/QuizModal.tsx ───────────────────────────────────────────
//
// STRUCTURE (read this before editing):
// ─────────────────────────────────────
//  1.  Imports
//  2.  API config constants
//  3.  MOCK_QUESTION_BANK  ← topic-keyed map of real questions (edit here to add topics)
//  4.  buildMockQuiz()     ← picks questions from the bank by topic name
//  5.  Types
//  6.  QuizModal component ← state machine: idle → loading → active → results
//
// MOCK FALLBACK BEHAVIOUR:
//   If the backend is down / Groq key not yet set, the fetch() fails silently
//   and buildMockQuiz() is called instead.  Each topic gets its own real
//   questions from the bank.  A ⚗ Demo badge appears in the modal header.
//   Once your backend is live the fallback never fires.
//
// TO ADD A NEW TOPIC to mock data:
//   Add a key to MOCK_QUESTION_BANK below with at least 2–3 QuizQuestion entries.
//   Keys are matched case-insensitively against the topic prop.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Loader2,
  AlertCircle,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { Button } from "../button";
import QuizCard from "./QuizCard";
import QuizResults from "./QuizResults";
import type { QuizQuestion, QuizPayload, AnswerState } from "./quiz.types";

// ─────────────────────────────────────────────────────────────────────────────
// 2. API CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// Set VITE_QUIZ_MOCK=true in .env to always use mock data (skips the fetch).
const FORCE_MOCK = import.meta.env.VITE_QUIZ_MOCK === "true";

// ─────────────────────────────────────────────────────────────────────────────
// 3. MOCK QUESTION BANK
//    Keys are lowercase topic names.  Each topic has its own unique questions —
//    no shared options, no repeated sentence structures.
//    Difficulty spread per topic: easy + medium + hard where possible.
// ─────────────────────────────────────────────────────────────────────────────

type MockQuestion = Omit<QuizQuestion, "topic">;

const MOCK_QUESTION_BANK: Record<string, MockQuestion[]> = {
  // ── Java Syntax ─────────────────────────────────────────────────────────────
  "java syntax": [
    {
      question: "Which keyword is used to define a class in Java?",
      options: ["define", "class", "struct", "object"],
      answer: "B",
      explanation:
        "Java uses the `class` keyword to declare a class. `struct` is from C/C++, and `define`/`object` are not valid Java keywords for this purpose.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "Java is case-sensitive, meaning `myVariable` and `MyVariable` are treated as the same identifier.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "Java is case-sensitive. `myVariable` and `MyVariable` are completely different identifiers, so naming matters precisely.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "What is the correct way to write a single-line comment in Java?",
      options: [
        "/* this is a comment */",
        "# this is a comment",
        "// this is a comment",
        "-- this is a comment",
      ],
      answer: "C",
      explanation:
        "// starts a single-line comment in Java. /* */ is for multi-line comments. # is Python/shell syntax. -- is SQL.",
      difficulty: "easy",
      question_type: "mcq",
    },
  ],

  // ── Variables and Data Types ─────────────────────────────────────────────────
  "variables and data types": [
    {
      question: "Which of the following is a primitive data type in Java?",
      options: ["String", "Integer", "int", "Array"],
      answer: "C",
      explanation:
        "`int` is a primitive type in Java. `String`, `Integer`, and `Array` are all reference (object) types. Primitives are lowercase: int, double, boolean, char, etc.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "A variable declared with the `final` keyword in Java can be reassigned after its initial value is set.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "`final` makes a variable a constant — once assigned, its value cannot change. Attempting to reassign it causes a compile-time error.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "What is the default value of an uninitialized `int` instance variable in Java?",
      options: ["null", "undefined", "0", "-1"],
      answer: "C",
      explanation:
        "In Java, uninitialized numeric instance variables default to 0. `null` is the default for reference types, and `undefined` is not a Java concept.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── Control Flow ─────────────────────────────────────────────────────────────
  "control flow": [
    {
      question:
        "Which loop in Java is guaranteed to execute its body at least once regardless of the condition?",
      options: ["for loop", "while loop", "do-while loop", "enhanced for loop"],
      answer: "C",
      explanation:
        "A `do-while` loop checks its condition after the first execution, so the body always runs at least once. `while` and `for` evaluate the condition before entering.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "In Java, a `break` statement inside a `switch` block exits only the switch, not any surrounding loop.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "`break` in a `switch` exits the switch statement. To break out of an enclosing loop from inside a switch, you need a labelled break.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question:
        "A developer needs to execute different code for 10 different integer values. Which structure is most readable?",
      options: [
        "A chain of 10 if-else if statements",
        "A switch statement with 10 cases",
        "A single while loop with nested ifs",
        "A recursive method call for each value",
      ],
      answer: "B",
      explanation:
        "A switch statement is designed exactly for matching a variable against multiple discrete values. It's more readable and often more performant than a long if-else chain.",
      difficulty: "medium",
      question_type: "scenario",
    },
  ],

  // ── Functions ────────────────────────────────────────────────────────────────
  functions: [
    {
      question: "What does a `void` return type indicate in a Java method?",
      options: [
        "The method returns a null object",
        "The method returns nothing",
        "The method is abstract",
        "The method can return any type",
      ],
      answer: "B",
      explanation:
        "`void` means the method performs an action but does not return a value. It is not the same as returning `null` — a `void` method has no return statement (or a bare `return;`).",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "Method overloading in Java means two methods can have the same name if they have different parameter lists.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "Overloading allows multiple methods with the same name as long as their parameter types or count differ. The compiler resolves which to call at compile time.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "Which principle does a well-designed function most closely follow?",
      options: [
        "A function should do as many things as possible to avoid having many functions",
        "A function should do exactly one thing and do it well",
        "A function should always return a value so callers can chain calls",
        "A function should be as long as needed to avoid splitting logic",
      ],
      answer: "B",
      explanation:
        "The Single Responsibility Principle (SRP) applied to functions means each function should have one clear purpose. This makes code easier to test, debug, and reuse.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── Classes and Objects ───────────────────────────────────────────────────────
  "classes and objects": [
    {
      question: "In Java, what is a constructor used for?",
      options: [
        "To destroy an object when it is no longer needed",
        "To initialise an object's state when it is created",
        "To define the static methods of a class",
        "To convert one object type to another",
      ],
      answer: "B",
      explanation:
        "A constructor initialises a new object's fields when `new` is called. It has the same name as the class and no return type. Java provides a default no-arg constructor if none is defined.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question: "In Java, a class and an object are the same thing.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "A class is a blueprint or template. An object is a runtime instance of that class. Many objects can be created from the same class, each with its own state.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "What does the `this` keyword refer to inside a Java instance method?",
      options: [
        "The parent class of the current object",
        "The current instance of the class",
        "A static reference shared across all instances",
        "The class definition itself",
      ],
      answer: "B",
      explanation:
        "`this` refers to the current object instance — useful for disambiguating instance fields from local variables with the same name, or for passing the current object as an argument.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── Encapsulation ────────────────────────────────────────────────────────────
  encapsulation: [
    {
      question:
        "Which access modifier makes a field accessible only within the class it is declared in?",
      options: ["public", "protected", "private", "default"],
      answer: "C",
      explanation:
        "`private` restricts access to the declaring class only. `public` is fully open, `protected` allows subclass and same-package access, and `default` allows same-package access.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "Encapsulation in Java is achieved by making fields public so other classes can access them directly.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "Encapsulation is about hiding internal state. Fields are made `private` and access is provided through getter/setter methods, giving the class control over how its data is read or modified.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "Why is a setter method useful even when it simply assigns the value to the field?",
      options: [
        "It makes the code longer, which improves readability",
        "It allows validation logic to be added later without changing callers",
        "It converts the field to a different data type automatically",
        "It is required by the Java compiler for private fields",
      ],
      answer: "B",
      explanation:
        "A setter centralises assignment. If validation (e.g. age must be positive) is needed later, you add it to the setter without touching any caller. This is a key benefit of encapsulation.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── Inheritance ───────────────────────────────────────────────────────────────
  inheritance: [
    {
      question:
        "Which keyword does a Java class use to inherit from another class?",
      options: ["implements", "extends", "inherits", "super"],
      answer: "B",
      explanation:
        "`extends` establishes an inheritance relationship in Java. `implements` is used for interfaces. `super` refers to the parent class but is not the declaration keyword.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "Java supports multiple inheritance through classes — a class can directly extend more than one class.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "Java does not allow a class to extend more than one class (to avoid the diamond problem). Multiple inheritance of behaviour is achieved through interfaces.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question:
        "When a subclass defines a method with the same signature as a parent class method, this is called:",
      options: ["Overloading", "Hiding", "Overriding", "Shadowing"],
      answer: "C",
      explanation:
        "Method overriding occurs when a subclass provides its own implementation of an inherited method. The @Override annotation is recommended to catch signature mismatches at compile time.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── Polymorphism ─────────────────────────────────────────────────────────────
  polymorphism: [
    {
      question:
        "What type of polymorphism is demonstrated when a method behaves differently based on the actual runtime object type?",
      options: [
        "Compile-time polymorphism",
        "Static polymorphism",
        "Runtime (dynamic) polymorphism",
        "Parametric polymorphism",
      ],
      answer: "C",
      explanation:
        "Runtime polymorphism uses method overriding and is resolved by the JVM at runtime based on the actual object type, not the reference type. This enables writing code against interfaces/base classes.",
      difficulty: "medium",
      question_type: "mcq",
    },
    {
      question:
        "In Java, method overloading is an example of runtime polymorphism.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "Method overloading is resolved at compile time (static/compile-time polymorphism). Runtime polymorphism is achieved through method overriding with inheritance.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question:
        "A developer writes `Animal a = new Dog();`. Which method is called when `a.speak()` is invoked, assuming Dog overrides speak()?",
      options: [
        "Animal's speak() because the reference type is Animal",
        "Dog's speak() because the actual object is a Dog",
        "Both methods are called in sequence",
        "A compile error occurs because the types don't match",
      ],
      answer: "B",
      explanation:
        "Java uses dynamic dispatch — the method called depends on the actual runtime object type, not the reference type. `a` holds a `Dog`, so `Dog.speak()` is invoked.",
      difficulty: "hard",
      question_type: "scenario",
    },
  ],

  // ── ArrayList ────────────────────────────────────────────────────────────────
  arraylist: [
    {
      question:
        "What is the main difference between an ArrayList and a plain array in Java?",
      options: [
        "ArrayList can only hold primitive types",
        "ArrayList has a fixed size set at creation",
        "ArrayList grows and shrinks dynamically as elements are added or removed",
        "ArrayList is faster than arrays for all operations",
      ],
      answer: "C",
      explanation:
        "ArrayList is a resizable array implementation. Unlike plain arrays whose length is fixed, ArrayList automatically resizes its internal array when capacity is exceeded.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "You can store primitive `int` values directly inside an `ArrayList<Integer>` in Java without any conversion.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "Java auto-boxing converts primitive `int` to `Integer` objects transparently when adding to an ArrayList. Unboxing happens automatically when retrieving. This is handled by the compiler.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "Which method removes an element at a specific index from an ArrayList?",
      options: ["delete(index)", "remove(index)", "pop(index)", "erase(index)"],
      answer: "B",
      explanation:
        "`remove(int index)` removes the element at the specified position and shifts subsequent elements left. `delete`, `pop`, and `erase` are not ArrayList methods.",
      difficulty: "easy",
      question_type: "mcq",
    },
  ],

  // ── HashMap ───────────────────────────────────────────────────────────────────
  hashmap: [
    {
      question: "What does a HashMap store?",
      options: [
        "A sequence of values indexed by integers",
        "Key-value pairs where keys must be unique",
        "Only primitive types as keys and values",
        "A sorted set of unique values",
      ],
      answer: "B",
      explanation:
        "HashMap stores key-value pairs. Keys must be unique — adding the same key overwrites the previous value. Both keys and values can be any object type.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "A HashMap in Java guarantees the insertion order of its entries.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "HashMap does not maintain insertion order. Use `LinkedHashMap` if you need insertion order, or `TreeMap` if you need sorted order.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question:
        "What is the time complexity of a `get()` operation on a well-distributed HashMap?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      answer: "C",
      explanation:
        "HashMap uses a hash function to map keys to buckets, giving O(1) average-case lookup. In the worst case (all keys hash to the same bucket), it degrades to O(n).",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── Stack & Queue ─────────────────────────────────────────────────────────────
  "stack & queue": [
    {
      question: "Which order does a Stack follow when removing elements?",
      options: [
        "First In First Out (FIFO)",
        "Last In First Out (LIFO)",
        "Sorted ascending order",
        "Random order",
      ],
      answer: "B",
      explanation:
        "A Stack follows LIFO — the last element pushed is the first to be popped. Think of a stack of plates: you always take from the top.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "A Queue is the right data structure to use when processing tasks in the order they arrived.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "Queues follow FIFO (First In First Out), making them ideal for task scheduling, print queues, breadth-first search, and any scenario where order of arrival matters.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "Which real-world scenario best maps to a Stack data structure?",
      options: [
        "A ticket queue at a concert",
        "Browser back-button history",
        "A round-robin CPU scheduler",
        "Loading passengers onto a bus",
      ],
      answer: "B",
      explanation:
        "Browser back history is a Stack — the most recently visited page is the first to return on 'back'. Concert queues and bus loading follow FIFO (Queue). Round-robin is neither.",
      difficulty: "medium",
      question_type: "scenario",
    },
  ],

  // ── Searching & Sorting ───────────────────────────────────────────────────────
  "searching & sorting": [
    {
      question:
        "Binary search requires the data to be in what state before it can be applied?",
      options: [
        "Stored in a HashMap",
        "Sorted in ascending or descending order",
        "Stored in a linked list",
        "No precondition — it works on any data",
      ],
      answer: "B",
      explanation:
        "Binary search repeatedly halves the search space by comparing with the midpoint. This only works correctly if the data is already sorted.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "Bubble Sort is generally considered efficient enough for large datasets in production systems.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "Bubble Sort has O(n²) time complexity, making it very slow for large datasets. Production systems use O(n log n) algorithms like Merge Sort, Quick Sort, or Java's built-in TimSort.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
      answer: "C",
      explanation:
        "Binary search eliminates half the remaining candidates each step, giving O(log n) comparisons. For 1,000,000 items it takes at most ~20 comparisons.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── REST APIs ─────────────────────────────────────────────────────────────────
  "rest apis": [
    {
      question:
        "Which HTTP method is conventionally used to create a new resource in a RESTful API?",
      options: ["GET", "PUT", "POST", "DELETE"],
      answer: "C",
      explanation:
        "POST creates a new resource. GET retrieves, PUT updates/replaces, and DELETE removes. Using the correct verb makes APIs predictable and self-documenting.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "A RESTful API should maintain session state on the server between requests.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "REST is stateless — each request must contain all information needed to process it. The server does not store client session state. This improves scalability.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question:
        "A client receives HTTP 404 from a REST endpoint. What does this mean?",
      options: [
        "The server crashed and needs restarting",
        "The request was malformed",
        "The requested resource was not found",
        "The client is not authenticated",
      ],
      answer: "C",
      explanation:
        "404 Not Found means the server cannot find the requested resource. 500 is a server error, 400 is a bad request, and 401/403 relate to authentication/authorisation.",
      difficulty: "easy",
      question_type: "scenario",
    },
  ],

  // ── Spring Boot Intro ─────────────────────────────────────────────────────────
  "spring boot intro": [
    {
      question: "What does the `@SpringBootApplication` annotation do?",
      options: [
        "It marks the class as a Spring bean",
        "It combines @Configuration, @EnableAutoConfiguration, and @ComponentScan",
        "It connects the application to a database",
        "It defines the REST controller entry point",
      ],
      answer: "B",
      explanation:
        "`@SpringBootApplication` is a convenience annotation that combines three annotations: @Configuration (bean definitions), @EnableAutoConfiguration (auto-configure Spring), and @ComponentScan (find components).",
      difficulty: "medium",
      question_type: "mcq",
    },
    {
      question:
        "Spring Boot requires you to manually configure an embedded web server like Tomcat in every project.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "Spring Boot's auto-configuration includes an embedded Tomcat (or Jetty/Undertow) by default. You do not need to configure or deploy a standalone server.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "Which annotation marks a Spring Boot class as a REST controller that returns JSON directly?",
      options: ["@Controller", "@Component", "@RestController", "@Service"],
      answer: "C",
      explanation:
        "`@RestController` combines `@Controller` and `@ResponseBody`, so every method return value is serialised directly to the HTTP response body (typically JSON).",
      difficulty: "easy",
      question_type: "mcq",
    },
  ],

  // ── Database Connection ───────────────────────────────────────────────────────
  "database connection": [
    {
      question:
        "In Spring Boot, which file is typically used to configure the database URL and credentials?",
      options: [
        "pom.xml",
        "application.properties or application.yml",
        "web.xml",
        "schema.sql",
      ],
      answer: "B",
      explanation:
        "`application.properties` (or `application.yml`) is Spring Boot's central configuration file. Database URL, username, password, and driver class are set here.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "A JDBC connection pool is recommended in production because creating a new database connection for every request is expensive.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "Establishing a database connection involves network handshake, authentication, and resource allocation. Pools reuse connections, dramatically reducing per-request overhead.",
      difficulty: "medium",
      question_type: "true_false",
    },
    {
      question:
        "Which Spring Data annotation marks an interface to be automatically implemented as a database repository?",
      options: ["@DatabaseRepo", "@Repository", "@DataSource", "@Entity"],
      answer: "B",
      explanation:
        "`@Repository` marks an interface extending JpaRepository (or CrudRepository). Spring Data automatically generates the implementation at runtime.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],

  // ── CRUD APIs ─────────────────────────────────────────────────────────────────
  "crud apis": [
    {
      question: "What does CRUD stand for?",
      options: [
        "Connect, Read, Update, Delete",
        "Create, Read, Update, Delete",
        "Create, Retrieve, Upload, Destroy",
        "Connect, Retrieve, Update, Deploy",
      ],
      answer: "B",
      explanation:
        "CRUD = Create, Read, Update, Delete — the four fundamental operations for persistent data. They map to POST, GET, PUT/PATCH, and DELETE in RESTful APIs.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "In a CRUD REST API, a GET request to `/users/42` should modify the user with ID 42.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "GET requests must be safe and idempotent — they read data without modifying it. Modifying data with GET violates REST semantics and HTTP standards.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "What HTTP status code should a well-designed REST API return after successfully creating a new resource?",
      options: ["200 OK", "201 Created", "204 No Content", "202 Accepted"],
      answer: "B",
      explanation:
        "201 Created signals successful resource creation. The response should also include a Location header pointing to the new resource. 200 OK is for successful reads/updates.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. buildMockQuiz
//    Picks questions from MOCK_QUESTION_BANK for each topic.
//    If a topic is not in the bank, falls back to 2 generic questions
//    so the UI never breaks.
// ─────────────────────────────────────────────────────────────────────────────

function buildMockQuiz(topics: string[], _subject: string): QuizQuestion[] {
  const result: QuizQuestion[] = [];

  // We want ~10 questions distributed evenly across topics
  const targetTotal = 10;
  const perTopic = Math.max(
    1,
    Math.ceil(targetTotal / Math.max(topics.length, 1)),
  );

  for (const topic of topics) {
    const key = topic.toLowerCase().trim();
    const bank = MOCK_QUESTION_BANK[key] ?? fallbackQuestions(topic);
    const count = Math.min(perTopic, bank.length);

    for (let i = 0; i < count; i++) {
      result.push({ ...bank[i], topic });
    }
  }

  // Trim or pad to exactly targetTotal if needed
  return result.slice(0, targetTotal);
}

// Generic fallback for topics not yet in the bank
function fallbackQuestions(topic: string): MockQuestion[] {
  return [
    {
      question: `Which statement most accurately describes ${topic}?`,
      options: [
        `${topic} is a core concept used to structure and organise code.`,
        `${topic} is only relevant during the deployment phase.`,
        `${topic} cannot be combined with other programming concepts.`,
        `${topic} is deprecated and no longer used in modern development.`,
      ],
      answer: "A",
      explanation: `${topic} is a foundational concept in software development, used to write structured, maintainable code. It is actively used in modern systems.`,
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question: `Understanding ${topic} is important for writing production-quality code.`,
      options: ["True", "False"],
      answer: "True",
      explanation: `${topic} is a key part of professional software development. Mastering it leads to cleaner, more maintainable, and more robust codebases.`,
      difficulty: "easy",
      question_type: "true_false",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "idle" | "loading" | "active" | "results";

interface Props {
  subject: string;
  topics: string[];
  weekTitle: string;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  total?: number;
  apiBase?: string;
  onComplete?: (score: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. QUIZMODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function QuizModal({
  subject,
  topics,
  weekTitle,
  difficulty = "mixed",
  total = 10,
  apiBase = API_BASE,
  onComplete,
}: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const hasCalledOnComplete = useRef(false);

  // ── Fetch with silent mock fallback ──────────────────────────────────────
  const fetchQuiz = useCallback(async () => {
    setStage("loading");
    setError(null);
    setAnswers([]);
    setCurrent(0);
    setIsMock(false);
    hasCalledOnComplete.current = false;

    const loadQuestions = (qs: QuizQuestion[]) => {
      setQuestions(qs);
      setAnswers(
        qs.map(() => ({ selected: null, submitted: false, correct: false })),
      );
      setStage("active");
    };

    // Force mock via env var (dev convenience)
    if (FORCE_MOCK) {
      await new Promise((r) => setTimeout(r, 900));
      setIsMock(true);
      loadQuestions(buildMockQuiz(topics, subject));
      return;
    }

    // Try real backend
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ FIX
        },
        body: JSON.stringify({ subject, topics, difficulty, total }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string })?.error ?? `Server error ${res.status}`,
        );
      }

      const payload: QuizPayload = await res.json();

      if (!payload.quiz?.length) {
        throw new Error("Empty quiz returned from server.");
      }

      // Real data — use it
      setIsMock(false);
      loadQuestions(payload.quiz);
    } catch (_err) {
      // Backend unavailable — fall back to topic-specific mock questions
      console.warn(
        "[QuizModal] Backend unreachable — using mock question bank.",
        _err,
      );
      setIsMock(true);
      loadQuestions(buildMockQuiz(topics, subject));
    }
  }, [subject, topics, difficulty, total, apiBase]);

  // ── Per-question handlers ─────────────────────────────────────────────────
  const handleSelect = (label: string) =>
    setAnswers((prev) =>
      prev.map((a, i) => (i === current ? { ...a, selected: label } : a)),
    );

  const handleSubmit = () => {
    const q = questions[current];
    const a = answers[current];
    if (!a.selected) return;
    const correct = a.selected === q.answer;
    setAnswers((prev) =>
      prev.map((ans, i) =>
        i === current ? { ...ans, submitted: true, correct } : ans,
      ),
    );
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setStage("results");
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleRetry = () => fetchQuiz();

  const handleOpen = () => {
    setOpen(true);
    fetchQuiz();
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStage("idle");
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setError(null);
      setIsMock(false);
    }, 350);
  };
  useEffect(() => {
    if (stage === "results" && !hasCalledOnComplete.current) {
      hasCalledOnComplete.current = true;

      const finalScore = answers.filter((a) => a.correct).length;

      onComplete?.(finalScore); // 👈 THIS sends score to parent
    }
  }, [stage, answers, onComplete]);

  const progressPct =
    stage === "active" && questions.length > 0
      ? Math.round((current / questions.length) * 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-green-400/40 text-white font-semibold transition-all duration-300"
      >
        <Brain className="h-4 w-4 text-green-400" />
        Take Quiz
      </Button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleClose}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 flex flex-col rounded-2xl border border-white/12 bg-gradient-to-b from-gray-950 via-black to-gray-950 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white leading-tight">
                        {weekTitle} Quiz
                      </p>
                      {isMock && stage !== "loading" && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold tracking-wider"
                        >
                          <FlaskConical className="h-2.5 w-2.5" />
                          Demo
                        </motion.span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-none mt-0.5">
                      {isMock && stage !== "loading"
                        ? "Using sample questions — connect backend for real quiz"
                        : subject}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              <AnimatePresence>
                {stage === "active" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-0.5 w-full bg-white/8 shrink-0"
                  >
                    <motion.div
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Loading */}
                  {stage === "loading" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-5 py-20"
                    >
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center">
                          <Brain className="h-6 w-6 text-green-400" />
                        </div>
                        <Loader2 className="absolute inset-0 m-auto h-14 w-14 text-green-500/30 animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">
                          Generating your quiz…
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Building {total} questions across {topics.length}{" "}
                          topic
                          {topics.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {stage === "idle" && error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center"
                    >
                      <AlertCircle className="h-10 w-10 text-red-400" />
                      <div>
                        <p className="text-white font-semibold">
                          Failed to generate quiz
                        </p>
                        <p className="text-sm text-gray-400 mt-1 max-w-sm">
                          {error}
                        </p>
                      </div>
                      <Button
                        onClick={fetchQuiz}
                        className="rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_10px_#16a34a] font-semibold"
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  )}

                  {/* Active question */}
                  {stage === "active" && questions.length > 0 && (
                    <QuizCard
                      key={current}
                      question={questions[current]}
                      index={current}
                      total={questions.length}
                      state={answers[current]}
                      onSelect={handleSelect}
                      onSubmit={handleSubmit}
                      onNext={handleNext}
                      isLast={current === questions.length - 1}
                    />
                  )}

                  {/* Results */}
                  {stage === "results" && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <QuizResults
                        questions={questions}
                        answers={answers}
                        weekTitle={weekTitle}
                        onRetry={handleRetry}
                        onClose={handleClose}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
