-- =============================================================
--  eStudentDB  –  Clean SQL Server Schema
--  Generated: 2026-06-12
-- =============================================================

USE master;
GO

IF DB_ID('eStudentDB') IS NULL
    CREATE DATABASE eStudentDB;
GO

USE eStudentDB;
GO

-- =============================================================
--  LOOKUP / REFERENCE TABLES
-- =============================================================

CREATE TABLE Roles (
    RoleId   INT          IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code     NVARCHAR(30) NOT NULL UNIQUE,
    Name     NVARCHAR(100) NOT NULL
);

CREATE TABLE Grades (
    GradeId INT          IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code    NVARCHAR(10) NOT NULL UNIQUE,
    Name    NVARCHAR(50) NOT NULL
);

CREATE TABLE AssessmentTypes (
    AssessmentTypeId INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code             NVARCHAR(30)  NOT NULL UNIQUE,
    Name             NVARCHAR(100) NOT NULL,
    DefaultWeight    DECIMAL(5,2)  NOT NULL DEFAULT 1
);

CREATE TABLE SchoolContacts (
    SchoolContactId INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name            NVARCHAR(150) NOT NULL,
    Email           NVARCHAR(150) NULL,
    Phone           NVARCHAR(30)  NULL,
    Address         NVARCHAR(MAX) NULL,
    WorkingHours    NVARCHAR(255) NULL,
    IsActive        BIT           NOT NULL DEFAULT 1
);

-- =============================================================
--  CORE ENTITIES
-- =============================================================

CREATE TABLE Users (
    UserId        UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    RoleId        INT              NOT NULL,
    Username      NVARCHAR(80)     NOT NULL UNIQUE,
    PasswordHash  NVARCHAR(255)    NOT NULL,
    FullName      NVARCHAR(150)    NOT NULL,
    Email         NVARCHAR(150)    NULL,
    Phone         NVARCHAR(30)     NULL,
    AvatarUrl     NVARCHAR(500)    NULL,
    IsActive      BIT              NOT NULL DEFAULT 1,
    LastLoginAt   DATETIME2(7)     NULL,
    CreatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Subjects (
    SubjectId   INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code        NVARCHAR(30)  NOT NULL UNIQUE,
    Name        NVARCHAR(120) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    IsActive    BIT           NOT NULL DEFAULT 1
);

CREATE TABLE Teachers (
    TeacherId    UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    UserId       UNIQUEIDENTIFIER NOT NULL UNIQUE,
    EmployeeCode NVARCHAR(50)     NOT NULL UNIQUE,
    SubjectId    INT              NOT NULL,
    Qualification NVARCHAR(150)  NULL,
    CreatedAt    DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Students (
    StudentId     UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    UserId        UNIQUEIDENTIFIER NOT NULL UNIQUE,
    StudentCode   NVARCHAR(50)     NOT NULL UNIQUE,
    DateOfBirth   DATE             NULL,
    Gender        NVARCHAR(20)     NULL,
    Address       NVARCHAR(MAX)    NULL,
    AdmissionDate DATE             NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Status        NVARCHAR(30)     NOT NULL DEFAULT 'ACTIVE',
    CreatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_Students_Status CHECK (Status IN ('ACTIVE', 'TRANSFERRED', 'GRADUATED', 'SUSPENDED'))
);

CREATE TABLE Parents (
    ParentId   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    UserId     UNIQUEIDENTIFIER NOT NULL UNIQUE,
    Occupation NVARCHAR(120)    NULL,
    Address    NVARCHAR(MAX)    NULL,
    CreatedAt  DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME()
);

-- =============================================================
--  SCHOOL STRUCTURE
-- =============================================================

CREATE TABLE SchoolYears (
    SchoolYearId INT          IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name         NVARCHAR(30) NOT NULL UNIQUE,
    StartDate    DATE         NOT NULL,
    EndDate      DATE         NOT NULL,
    IsCurrent    BIT          NOT NULL DEFAULT 0,

    CONSTRAINT CK_SchoolYears_Date CHECK (StartDate < EndDate)
);

CREATE TABLE Semesters (
    SemesterId   INT          IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SchoolYearId INT          NOT NULL,
    Name         NVARCHAR(50) NOT NULL,
    StartDate    DATE         NOT NULL,
    EndDate      DATE         NOT NULL,

    CONSTRAINT UQ_Semesters   UNIQUE (SchoolYearId, Name),
    CONSTRAINT CK_Semesters_Date CHECK (StartDate < EndDate)
);

CREATE TABLE Classes (
    ClassId           INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SchoolYearId      INT              NOT NULL,
    GradeId           INT              NOT NULL,
    Name              NVARCHAR(50)     NOT NULL,
    HomeroomTeacherId UNIQUEIDENTIFIER NULL,
    TrainingProgram   NVARCHAR(30)     NOT NULL DEFAULT 'REGULAR',
    Room              NVARCHAR(50)     NULL,
    IsActive          BIT              NOT NULL DEFAULT 1,

    CONSTRAINT UQ_Classes              UNIQUE (SchoolYearId, Name, TrainingProgram),
    CONSTRAINT CK_Classes_Training     CHECK  (TrainingProgram IN ('REGULAR', 'REVISION'))
);

CREATE TABLE ClassEnrollments (
    EnrollmentId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ClassId      INT              NOT NULL,
    StudentId    UNIQUEIDENTIFIER NOT NULL,
    EnrolledAt   DATE             NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    LeftAt       DATE             NULL,
    Status       NVARCHAR(30)     NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT UQ_ClassEnrollments       UNIQUE (ClassId, StudentId),
    CONSTRAINT CK_ClassEnrollments_Date  CHECK  (LeftAt IS NULL OR LeftAt >= EnrolledAt),
    CONSTRAINT CK_ClassEnrollments_Status CHECK (Status IN ('ACTIVE', 'LEFT', 'COMPLETED'))
);

CREATE TABLE StudentParentLinks (
    StudentId        UNIQUEIDENTIFIER NOT NULL,
    ParentId         UNIQUEIDENTIFIER NOT NULL,
    Relationship     NVARCHAR(50)     NOT NULL,
    IsPrimaryContact BIT              NOT NULL DEFAULT 0,

    PRIMARY KEY (StudentId, ParentId)
);

CREATE TABLE TeacherClassAssignments (
    AssignmentId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    TeacherId    UNIQUEIDENTIFIER NOT NULL,
    ClassId      INT              NOT NULL,
    SubjectId    INT              NOT NULL,
    SchoolYearId INT              NOT NULL,

    CONSTRAINT UQ_TeacherClassAssignments UNIQUE (TeacherId, ClassId, SubjectId, SchoolYearId)
);

-- =============================================================
--  TIMETABLE & LESSONS
-- =============================================================

CREATE TABLE TimetableSlots (
    TimetableSlotId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ClassId         INT              NOT NULL,
    SubjectId       INT              NOT NULL,
    TeacherId       UNIQUEIDENTIFIER NOT NULL,
    SemesterId      INT              NOT NULL,
    DayOfWeek       TINYINT          NOT NULL,
    PeriodNo        TINYINT          NOT NULL,
    StartTime       TIME(7)          NOT NULL,
    EndTime         TIME(7)          NOT NULL,
    Room            NVARCHAR(50)     NULL,
    EffectiveFrom   DATE             NOT NULL,
    EffectiveTo     DATE             NULL,

    CONSTRAINT CK_Timetable_Day    CHECK (DayOfWeek >= 1 AND DayOfWeek <= 7),
    CONSTRAINT CK_Timetable_Period CHECK (PeriodNo > 0),
    CONSTRAINT CK_Timetable_Time   CHECK (StartTime < EndTime)
);

CREATE TABLE LessonSessions (
    LessonSessionId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    TimetableSlotId INT              NULL,
    ClassId         INT              NOT NULL,
    SubjectId       INT              NOT NULL,
    TeacherId       UNIQUEIDENTIFIER NOT NULL,
    SessionDate     DATE             NOT NULL,
    PeriodNo        TINYINT          NOT NULL,
    Room            NVARCHAR(50)     NULL,
    Topic           NVARCHAR(255)    NULL,
    Status          NVARCHAR(30)     NOT NULL DEFAULT 'SCHEDULED',
    CreatedAt       DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_LessonSessions_Status CHECK (Status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE AttendanceRecords (
    AttendanceId    INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    LessonSessionId INT              NOT NULL,
    StudentId       UNIQUEIDENTIFIER NOT NULL,
    Status          NVARCHAR(30)     NOT NULL,
    Note            NVARCHAR(MAX)    NULL,
    RecordedBy      UNIQUEIDENTIFIER NOT NULL,
    RecordedAt      DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_Attendance       UNIQUE (LessonSessionId, StudentId),
    CONSTRAINT CK_Attendance_Status CHECK  (Status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'))
);

-- =============================================================
--  ASSESSMENTS & MARKS
-- =============================================================

CREATE TABLE Assessments (
    AssessmentId     INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ClassId          INT              NOT NULL,
    SubjectId        INT              NOT NULL,
    TeacherId        UNIQUEIDENTIFIER NOT NULL,
    SemesterId       INT              NOT NULL,
    AssessmentTypeId INT              NOT NULL,
    Title            NVARCHAR(255)    NOT NULL,
    AssessmentDate   DATE             NOT NULL,
    MaxScore         DECIMAL(5,2)     NOT NULL DEFAULT 10,
    Weight           DECIMAL(5,2)     NOT NULL DEFAULT 1,
    Description      NVARCHAR(MAX)    NULL,
    Status           NVARCHAR(30)     NOT NULL DEFAULT 'SCHEDULED',
    CreatedAt        DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_Assessments_MaxScore CHECK (MaxScore > 0),
    CONSTRAINT CK_Assessments_Weight   CHECK (Weight > 0),
    CONSTRAINT CK_Assessments_Status   CHECK (Status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE StudentMarks (
    StudentMarkId   INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AssessmentId    INT              NOT NULL,
    StudentId       UNIQUEIDENTIFIER NOT NULL,
    Score           DECIMAL(5,2)     NOT NULL,
    TeacherComment  NVARCHAR(MAX)    NULL,
    Remark          NVARCHAR(MAX)    NULL,   -- term progress remark (ProgressDetail.remark)
    GradedBy        UNIQUEIDENTIFIER NOT NULL,
    GradedAt        DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_StudentMarks       UNIQUE (AssessmentId, StudentId),
    CONSTRAINT CK_StudentMarks_Score CHECK  (Score >= 0)
);

CREATE TABLE SkillAreas (
    SkillAreaId INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SubjectId   INT           NOT NULL,
    Code        NVARCHAR(50)  NOT NULL,
    Name        NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX) NULL,

    CONSTRAINT UQ_SkillAreas UNIQUE (SubjectId, Code)
);

CREATE TABLE AssessmentSkillEvaluations (
    EvaluationId    INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentMarkId   INT           NOT NULL,
    SkillAreaId     INT           NOT NULL,
    MasteryLevel    DECIMAL(5,2)  NULL,
    Strengths       NVARCHAR(MAX) NULL,
    Weaknesses      NVARCHAR(MAX) NULL,
    TeacherFeedback NVARCHAR(MAX) NULL,
    Evidence        NVARCHAR(MAX) NULL,    -- JSON
    CreatedAt       DATETIME2(7)  NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_AssessmentSkillEvaluations UNIQUE (StudentMarkId, SkillAreaId),
    CONSTRAINT CK_Evaluations_Mastery        CHECK  (MasteryLevel IS NULL OR (MasteryLevel >= 0 AND MasteryLevel <= 100)),
    CONSTRAINT CK_Evaluations_EvidenceJson   CHECK  (Evidence IS NULL OR ISJSON(Evidence) = 1)
);

-- =============================================================
--  STUDY RESOURCES & AI
-- =============================================================

CREATE TABLE StudyResources (
    ResourceId   INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SubjectId    INT              NOT NULL,
    ClassId      INT              NULL,
    UploadedBy   UNIQUEIDENTIFIER NOT NULL,
    Title        NVARCHAR(255)    NOT NULL,
    Description  NVARCHAR(MAX)    NULL,
    ResourceType NVARCHAR(30)     NOT NULL,
    FileUrl      NVARCHAR(500)    NOT NULL,
    ThumbnailUrl NVARCHAR(500)    NULL,
    Visibility   NVARCHAR(30)     NOT NULL DEFAULT 'CLASS_ONLY',
    CreatedAt    DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_Resources_Type       CHECK (ResourceType IN ('IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'LINK')),
    CONSTRAINT CK_Resources_Visibility CHECK (Visibility   IN ('CLASS_ONLY', 'SCHOOL', 'TEACHER_ONLY'))
);

CREATE TABLE AiKnowledgeChunks (
    AiKnowledgeChunkId INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ResourceId         INT           NULL,
    ChunkIndex         INT           NOT NULL,
    Content            NVARCHAR(MAX) NOT NULL,
    Metadata           NVARCHAR(MAX) NULL,    -- JSON
    CreatedAt          DATETIME2(7)  NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_AiKnowledgeChunks        UNIQUE (ResourceId, ChunkIndex),
    CONSTRAINT CK_AiKnowledgeChunks_MetaJson CHECK (Metadata IS NULL OR ISJSON(Metadata) = 1)
);

CREATE TABLE AiRecommendationRuns (
    AiRunId       INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentId     UNIQUEIDENTIFIER NOT NULL,
    SubjectId     INT              NULL,
    SourceType    NVARCHAR(50)     NOT NULL,
    SourceId      NVARCHAR(100)    NULL,
    ModelName     NVARCHAR(100)    NULL,
    InputSnapshot NVARCHAR(MAX)    NOT NULL,  -- JSON
    OutputSummary NVARCHAR(MAX)    NULL,
    Confidence    DECIMAL(5,2)     NULL,
    CreatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_AiRuns_Confidence  CHECK (Confidence IS NULL OR (Confidence >= 0 AND Confidence <= 100)),
    CONSTRAINT CK_AiRuns_InputJson   CHECK (ISJSON(InputSnapshot) = 1)
);

-- =============================================================
--  LEARNING PATHS
-- =============================================================

CREATE TABLE LearningPaths (
    LearningPathId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentId      UNIQUEIDENTIFIER NOT NULL,
    SubjectId      INT              NOT NULL,
    AiRunId        INT              NULL,
    Title          NVARCHAR(255)    NOT NULL,
    Goal           NVARCHAR(MAX)    NOT NULL,
    Status         NVARCHAR(30)     NOT NULL DEFAULT 'ACTIVE',
    StartDate      DATE             NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    TargetEndDate  DATE             NULL,
    CreatedAt      DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_LearningPaths_Status CHECK (Status IN ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'))
);

CREATE TABLE LearningPathItems (
    LearningPathItemId INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    LearningPathId     INT           NOT NULL,
    SkillAreaId        INT           NULL,
    ResourceId         INT           NULL,
    Title              NVARCHAR(255) NOT NULL,
    Description        NVARCHAR(MAX) NULL,
    Priority           TINYINT       NOT NULL DEFAULT 3,
    DueDate            DATE          NULL,
    Status             NVARCHAR(30)  NOT NULL DEFAULT 'TODO',
    CompletedAt        DATETIME2(7)  NULL,

    CONSTRAINT CK_LearningPathItems_Priority CHECK (Priority >= 1 AND Priority <= 5),
    CONSTRAINT CK_LearningPathItems_Status   CHECK (Status IN ('TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'))
);

-- =============================================================
--  COMMUNICATION
-- =============================================================

CREATE TABLE ChatGroups (
    ChatGroupId  INT           IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ClassId      INT           NOT NULL,
    SchoolYearId INT           NOT NULL,
    GroupType    NVARCHAR(30)  NOT NULL,
    Name         NVARCHAR(150) NOT NULL,
    CreatedAt    DATETIME2(7)  NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_ChatGroups      UNIQUE (ClassId, SchoolYearId, GroupType),
    CONSTRAINT CK_ChatGroups_Type CHECK  (GroupType IN ('STUDENT_TEACHER', 'PARENT_TEACHER'))
);

CREATE TABLE ChatGroupMembers (
    ChatGroupId INT              NOT NULL,
    UserId      UNIQUEIDENTIFIER NOT NULL,
    JoinedAt    DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),
    LeftAt      DATETIME2(7)     NULL,

    PRIMARY KEY (ChatGroupId, UserId)
);

CREATE TABLE ChatMessages (
    ChatMessageId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ChatGroupId   INT              NOT NULL,
    SenderUserId  UNIQUEIDENTIFIER NOT NULL,
    MessageText   NVARCHAR(MAX)    NULL,
    AttachmentUrl NVARCHAR(500)    NULL,
    CreatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),
    DeletedAt     DATETIME2(7)     NULL,

    CONSTRAINT CK_ChatMessages_Content CHECK (MessageText IS NOT NULL OR AttachmentUrl IS NOT NULL)
);

CREATE TABLE Notifications (
    NotificationId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SenderUserId   UNIQUEIDENTIFIER NOT NULL,
    Title          NVARCHAR(255)    NOT NULL,
    Content        NVARCHAR(MAX)    NOT NULL,
    Category       NVARCHAR(50)     NOT NULL,
    TargetType     NVARCHAR(30)     NOT NULL,
    TargetId       NVARCHAR(100)    NULL,
    CreatedAt      DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_Notifications_Target CHECK (TargetType IN ('ALL', 'ROLE', 'CLASS', 'STUDENT', 'PARENT', 'TEACHER'))
);

CREATE TABLE NotificationRecipients (
    NotificationId INT              NOT NULL,
    UserId         UNIQUEIDENTIFIER NOT NULL,
    ReadAt         DATETIME2(7)     NULL,

    PRIMARY KEY (NotificationId, UserId)
);

CREATE TABLE FeedbackTickets (
    FeedbackTicketId INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SenderUserId     UNIQUEIDENTIFIER NOT NULL,
    RelatedStudentId UNIQUEIDENTIFIER NULL,
    Category         NVARCHAR(50)     NOT NULL,
    Subject          NVARCHAR(255)    NOT NULL,
    Content          NVARCHAR(MAX)    NOT NULL,
    Status           NVARCHAR(30)     NOT NULL DEFAULT 'OPEN',
    HandledBy        UNIQUEIDENTIFIER NULL,
    HandledAt        DATETIME2(7)     NULL,
    AdminResponse    NVARCHAR(MAX)    NULL,
    CreatedAt        DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_Feedback_Status CHECK (Status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
);

-- =============================================================
--  NEWS
-- =============================================================

CREATE TABLE NewsPosts (
    NewsPostId    INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AuthorUserId  UNIQUEIDENTIFIER NOT NULL,
    Category      NVARCHAR(50)     NOT NULL DEFAULT 'GENERAL',   -- e.g. GENERAL, CLASS_LIST, EVENT, ANNOUNCEMENT
    Title         NVARCHAR(255)    NOT NULL,
    Slug          NVARCHAR(255)    NOT NULL UNIQUE,
    Content       NVARCHAR(MAX)    NOT NULL,
    CoverImageUrl NVARCHAR(500)    NULL,
    Status        NVARCHAR(30)     NOT NULL DEFAULT 'DRAFT',
    PublishedAt   DATETIME2(7)     NULL,
    CreatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt     DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_News_Status CHECK (Status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

-- =============================================================
--  REGISTRATION REQUESTS
-- =============================================================

CREATE TABLE RegistrationRequests (
    RequestId      INT              IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FullName       NVARCHAR(150)    NOT NULL,
    Email          NVARCHAR(150)    NOT NULL,
    Phone          NVARCHAR(30)     NULL,
    RoleRequested  NVARCHAR(30)     NOT NULL,
    Message        NVARCHAR(MAX)    NULL,
    Status         NVARCHAR(30)     NOT NULL DEFAULT 'PENDING',
    ReviewedBy     UNIQUEIDENTIFIER NULL,
    ReviewNotes    NVARCHAR(MAX)    NULL,
    ReviewedAt     DATETIME2(7)     NULL,
    CreatedAt      DATETIME2(7)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_RegReq_Role   CHECK (RoleRequested IN ('student', 'parent', 'teacher')),
    CONSTRAINT CK_RegReq_Status CHECK (Status        IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- =============================================================
--  INDEXES
-- =============================================================

CREATE INDEX IX_Users_RoleId              ON Users                  (RoleId);
CREATE INDEX IX_Classes_YearGrade         ON Classes                (SchoolYearId, GradeId);
CREATE INDEX IX_ClassEnrollments_Student  ON ClassEnrollments       (StudentId);
CREATE INDEX IX_Lessons_ClassDate         ON LessonSessions         (ClassId, SessionDate);
CREATE INDEX IX_Attendance_Student        ON AttendanceRecords      (StudentId);
CREATE INDEX IX_StudentMarks_Student      ON StudentMarks           (StudentId);
CREATE INDEX IX_Resources_SubjectClass    ON StudyResources         (SubjectId, ClassId);
CREATE INDEX IX_AiRuns_StudentSubject     ON AiRecommendationRuns   (StudentId, SubjectId);
CREATE INDEX IX_Timetable_ClassDay        ON TimetableSlots         (ClassId, DayOfWeek);
CREATE INDEX IX_RegReq_Status             ON RegistrationRequests   (Status);
CREATE INDEX IX_News_Category             ON NewsPosts              (Category);

-- =============================================================
--  FOREIGN KEYS
-- =============================================================

-- Users
ALTER TABLE Users                   ADD CONSTRAINT FK_Users_Roles                  FOREIGN KEY (RoleId)              REFERENCES Roles                (RoleId);

-- Teachers / Students / Parents
ALTER TABLE Teachers                ADD CONSTRAINT FK_Teachers_Users                FOREIGN KEY (UserId)              REFERENCES Users                (UserId);
ALTER TABLE Teachers                ADD CONSTRAINT FK_Teachers_Subjects             FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE Students                ADD CONSTRAINT FK_Students_Users                FOREIGN KEY (UserId)              REFERENCES Users                (UserId);
ALTER TABLE Parents                 ADD CONSTRAINT FK_Parents_Users                 FOREIGN KEY (UserId)              REFERENCES Users                (UserId);
ALTER TABLE StudentParentLinks      ADD CONSTRAINT FK_SPL_Students                  FOREIGN KEY (StudentId)           REFERENCES Students             (StudentId);
ALTER TABLE StudentParentLinks      ADD CONSTRAINT FK_SPL_Parents                   FOREIGN KEY (ParentId)            REFERENCES Parents              (ParentId);

-- School structure
ALTER TABLE Semesters               ADD CONSTRAINT FK_Semesters_SchoolYears         FOREIGN KEY (SchoolYearId)        REFERENCES SchoolYears          (SchoolYearId);
ALTER TABLE Classes                 ADD CONSTRAINT FK_Classes_SchoolYears            FOREIGN KEY (SchoolYearId)        REFERENCES SchoolYears          (SchoolYearId);
ALTER TABLE Classes                 ADD CONSTRAINT FK_Classes_Grades                 FOREIGN KEY (GradeId)             REFERENCES Grades               (GradeId);
ALTER TABLE Classes                 ADD CONSTRAINT FK_Classes_HomeroomTeacher        FOREIGN KEY (HomeroomTeacherId)   REFERENCES Teachers             (TeacherId);
ALTER TABLE ClassEnrollments        ADD CONSTRAINT FK_ClassEnrollments_Classes       FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE ClassEnrollments        ADD CONSTRAINT FK_ClassEnrollments_Students      FOREIGN KEY (StudentId)           REFERENCES Students             (StudentId);
ALTER TABLE TeacherClassAssignments ADD CONSTRAINT FK_TCA_Teachers                  FOREIGN KEY (TeacherId)           REFERENCES Teachers             (TeacherId);
ALTER TABLE TeacherClassAssignments ADD CONSTRAINT FK_TCA_Classes                   FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE TeacherClassAssignments ADD CONSTRAINT FK_TCA_Subjects                  FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE TeacherClassAssignments ADD CONSTRAINT FK_TCA_SchoolYears               FOREIGN KEY (SchoolYearId)        REFERENCES SchoolYears          (SchoolYearId);

-- Timetable & lessons
ALTER TABLE TimetableSlots          ADD CONSTRAINT FK_Timetable_Classes             FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE TimetableSlots          ADD CONSTRAINT FK_Timetable_Subjects            FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE TimetableSlots          ADD CONSTRAINT FK_Timetable_Teachers            FOREIGN KEY (TeacherId)           REFERENCES Teachers             (TeacherId);
ALTER TABLE TimetableSlots          ADD CONSTRAINT FK_Timetable_Semesters           FOREIGN KEY (SemesterId)          REFERENCES Semesters            (SemesterId);
ALTER TABLE LessonSessions          ADD CONSTRAINT FK_LessonSessions_Timetable      FOREIGN KEY (TimetableSlotId)     REFERENCES TimetableSlots       (TimetableSlotId);
ALTER TABLE LessonSessions          ADD CONSTRAINT FK_LessonSessions_Classes        FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE LessonSessions          ADD CONSTRAINT FK_LessonSessions_Subjects       FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE LessonSessions          ADD CONSTRAINT FK_LessonSessions_Teachers       FOREIGN KEY (TeacherId)           REFERENCES Teachers             (TeacherId);
ALTER TABLE AttendanceRecords       ADD CONSTRAINT FK_Attendance_Lessons            FOREIGN KEY (LessonSessionId)     REFERENCES LessonSessions       (LessonSessionId);
ALTER TABLE AttendanceRecords       ADD CONSTRAINT FK_Attendance_Students           FOREIGN KEY (StudentId)           REFERENCES Students             (StudentId);
ALTER TABLE AttendanceRecords       ADD CONSTRAINT FK_Attendance_RecordedBy         FOREIGN KEY (RecordedBy)          REFERENCES Users                (UserId);

-- Assessments & marks
ALTER TABLE Assessments             ADD CONSTRAINT FK_Assessments_Classes           FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE Assessments             ADD CONSTRAINT FK_Assessments_Subjects          FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE Assessments             ADD CONSTRAINT FK_Assessments_Teachers          FOREIGN KEY (TeacherId)           REFERENCES Teachers             (TeacherId);
ALTER TABLE Assessments             ADD CONSTRAINT FK_Assessments_Semesters         FOREIGN KEY (SemesterId)          REFERENCES Semesters            (SemesterId);
ALTER TABLE Assessments             ADD CONSTRAINT FK_Assessments_Types             FOREIGN KEY (AssessmentTypeId)    REFERENCES AssessmentTypes      (AssessmentTypeId);
ALTER TABLE StudentMarks            ADD CONSTRAINT FK_StudentMarks_Assessments      FOREIGN KEY (AssessmentId)        REFERENCES Assessments          (AssessmentId);
ALTER TABLE StudentMarks            ADD CONSTRAINT FK_StudentMarks_Students         FOREIGN KEY (StudentId)           REFERENCES Students             (StudentId);
ALTER TABLE StudentMarks            ADD CONSTRAINT FK_StudentMarks_Teachers         FOREIGN KEY (GradedBy)            REFERENCES Teachers             (TeacherId);
ALTER TABLE SkillAreas              ADD CONSTRAINT FK_SkillAreas_Subjects           FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE AssessmentSkillEvaluations ADD CONSTRAINT FK_Evaluations_Marks         FOREIGN KEY (StudentMarkId)       REFERENCES StudentMarks         (StudentMarkId);
ALTER TABLE AssessmentSkillEvaluations ADD CONSTRAINT FK_Evaluations_Skills        FOREIGN KEY (SkillAreaId)         REFERENCES SkillAreas           (SkillAreaId);

-- Study resources & AI
ALTER TABLE StudyResources          ADD CONSTRAINT FK_Resources_Subjects            FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE StudyResources          ADD CONSTRAINT FK_Resources_Classes             FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE StudyResources          ADD CONSTRAINT FK_Resources_UploadedBy          FOREIGN KEY (UploadedBy)          REFERENCES Users                (UserId);
ALTER TABLE AiKnowledgeChunks       ADD CONSTRAINT FK_AiChunks_Resources            FOREIGN KEY (ResourceId)          REFERENCES StudyResources       (ResourceId);
ALTER TABLE AiRecommendationRuns    ADD CONSTRAINT FK_AiRuns_Students               FOREIGN KEY (StudentId)           REFERENCES Students             (StudentId);
ALTER TABLE AiRecommendationRuns    ADD CONSTRAINT FK_AiRuns_Subjects               FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);

-- Learning paths
ALTER TABLE LearningPaths           ADD CONSTRAINT FK_LearningPaths_Students        FOREIGN KEY (StudentId)           REFERENCES Students             (StudentId);
ALTER TABLE LearningPaths           ADD CONSTRAINT FK_LearningPaths_Subjects        FOREIGN KEY (SubjectId)           REFERENCES Subjects             (SubjectId);
ALTER TABLE LearningPaths           ADD CONSTRAINT FK_LearningPaths_AiRuns          FOREIGN KEY (AiRunId)             REFERENCES AiRecommendationRuns (AiRunId);
ALTER TABLE LearningPathItems       ADD CONSTRAINT FK_LPI_Paths                     FOREIGN KEY (LearningPathId)      REFERENCES LearningPaths        (LearningPathId);
ALTER TABLE LearningPathItems       ADD CONSTRAINT FK_LPI_Skills                    FOREIGN KEY (SkillAreaId)         REFERENCES SkillAreas           (SkillAreaId);
ALTER TABLE LearningPathItems       ADD CONSTRAINT FK_LPI_Resources                 FOREIGN KEY (ResourceId)          REFERENCES StudyResources       (ResourceId);

-- Communication
ALTER TABLE ChatGroups              ADD CONSTRAINT FK_ChatGroups_Classes             FOREIGN KEY (ClassId)             REFERENCES Classes              (ClassId);
ALTER TABLE ChatGroups              ADD CONSTRAINT FK_ChatGroups_SchoolYears         FOREIGN KEY (SchoolYearId)        REFERENCES SchoolYears          (SchoolYearId);
ALTER TABLE ChatGroupMembers        ADD CONSTRAINT FK_CGM_Groups                    FOREIGN KEY (ChatGroupId)         REFERENCES ChatGroups           (ChatGroupId);
ALTER TABLE ChatGroupMembers        ADD CONSTRAINT FK_CGM_Users                     FOREIGN KEY (UserId)              REFERENCES Users                (UserId);
ALTER TABLE ChatMessages            ADD CONSTRAINT FK_ChatMessages_Groups            FOREIGN KEY (ChatGroupId)         REFERENCES ChatGroups           (ChatGroupId);
ALTER TABLE ChatMessages            ADD CONSTRAINT FK_ChatMessages_Users             FOREIGN KEY (SenderUserId)        REFERENCES Users                (UserId);
ALTER TABLE Notifications           ADD CONSTRAINT FK_Notifications_Users            FOREIGN KEY (SenderUserId)        REFERENCES Users                (UserId);
ALTER TABLE NotificationRecipients  ADD CONSTRAINT FK_NR_Notifications              FOREIGN KEY (NotificationId)      REFERENCES Notifications        (NotificationId);
ALTER TABLE NotificationRecipients  ADD CONSTRAINT FK_NR_Users                      FOREIGN KEY (UserId)              REFERENCES Users                (UserId);
ALTER TABLE FeedbackTickets         ADD CONSTRAINT FK_Feedback_Sender               FOREIGN KEY (SenderUserId)        REFERENCES Users                (UserId);
ALTER TABLE FeedbackTickets         ADD CONSTRAINT FK_Feedback_Students             FOREIGN KEY (RelatedStudentId)    REFERENCES Students             (StudentId);
ALTER TABLE FeedbackTickets         ADD CONSTRAINT FK_Feedback_Handler              FOREIGN KEY (HandledBy)           REFERENCES Users                (UserId);

-- News
ALTER TABLE NewsPosts               ADD CONSTRAINT FK_News_Users                    FOREIGN KEY (AuthorUserId)        REFERENCES Users                (UserId);

-- Registration requests
ALTER TABLE RegistrationRequests    ADD CONSTRAINT FK_RegReq_ReviewedBy             FOREIGN KEY (ReviewedBy)          REFERENCES Users                (UserId);

