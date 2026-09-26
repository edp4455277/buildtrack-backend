-- Active: 1785663082958@@localhost@3306@buildtrackdb
-- CREATE DATABASE
DROP DATABASE IF EXISTS BuildTrackDB;

CREATE DATABASE BuildTrackDB;

USE BuildTrackDB;

-- CREATE CLIENTS TABLE
CREATE TABLE Clients (
    Client_ID INT PRIMARY KEY,
    Client_Name VARCHAR(100),
    Phone_Number VARCHAR(30),
    Email VARCHAR(100) UNIQUE,
    Address VARCHAR(100),
    INDEX idx_client_name (Client_Name)
);

-- CREATE CONTRACTORS TABLE
CREATE TABLE Contractors (
    Contractor_ID INT PRIMARY KEY,
    Contractor_Name VARCHAR(100),
    Phone_Number VARCHAR(30),
    Email VARCHAR(100) UNIQUE,
    Address VARCHAR(100),
    License_Number VARCHAR(50) UNIQUE,
    INDEX idx_contractor_name (Contractor_Name)
);

-- CREATE EMPLOYEES TABLE
CREATE TABLE Employees (
    Employee_ID INT PRIMARY KEY,
    Employee_Name VARCHAR(100),
    Phone_Number VARCHAR(30),
    Email VARCHAR(100) UNIQUE,
    Job_Title VARCHAR(150),
    Address VARCHAR(100),
    Hire_Date DATE,
    INDEX idx_employee_name (Employee_Name)
);

-- CREATE PROJECTS TABLE
CREATE TABLE Projects (
    Project_ID INT PRIMARY KEY,
    Client_ID INT,
    Contractor_ID INT,
    Project_Manager_ID INT,
    Project_Name VARCHAR(100),
    Project_Description TEXT,
    Start_Date DATE,
    Expected_End_Date DATE,
    Actual_End_Date DATE,
    Project_Status ENUM('Planned','Active','Completed','On Hold','Cancelled') NOT NULL DEFAULT 'Planned',
    Project_Budget DECIMAL(14,2),
    FOREIGN KEY (Client_ID) REFERENCES Clients(Client_ID),
    FOREIGN KEY (Contractor_ID) REFERENCES Contractors(Contractor_ID),
    FOREIGN KEY (Project_Manager_ID) REFERENCES Employees(Employee_ID),
    CHECK (Project_Budget >= 0),
    CHECK (Expected_End_Date IS NULL OR Start_Date IS NULL OR Expected_End_Date >= Start_Date),
    INDEX idx_project_name (Project_Name),
    INDEX idx_project_status (Project_Status),
    INDEX idx_project_client (Client_ID)
);

-- CREATE SUPPLIERS TABLE
CREATE TABLE Suppliers (
    Supplier_ID INT PRIMARY KEY,
    Supplier_Name VARCHAR(100),
    Phone_Number VARCHAR(30),
    Email VARCHAR(100) UNIQUE,
    Address VARCHAR(100),
    INDEX idx_supplier_name (Supplier_Name)
);

-- CREATE MATERIALS TABLE
CREATE TABLE Materials (
    Material_ID INT PRIMARY KEY,
    Material_Name VARCHAR(100),
    Unit VARCHAR(50),
    Unit_Price DECIMAL(12,2),
    Stock_Quantity DECIMAL(12,2),
    Reorder_Level DECIMAL(12,2),
    CHECK (Unit_Price >= 0),
    CHECK (Stock_Quantity >= 0),
    CHECK (Reorder_Level >= 0),
    INDEX idx_material_name (Material_Name)
);

-- CREATE PURCHASE ORDERS TABLE
CREATE TABLE Purchase_Orders (
    Purchase_Order_ID INT PRIMARY KEY,
    Project_ID INT,
    Supplier_ID INT,
    Order_Date DATE,
    Expected_Delivery_Date DATE,
    Status ENUM('Draft','Approved','Partially Delivered','Delivered','Cancelled') NOT NULL DEFAULT 'Draft',
    Total_Amount DECIMAL(14,2),
    FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
    FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID),
    CHECK (Total_Amount >= 0),
    INDEX idx_po_project (Project_ID),
    INDEX idx_po_supplier (Supplier_ID),
    INDEX idx_po_date (Order_Date)
);

-- CREATE PURCHASE ORDER ITEMS TABLE
CREATE TABLE Purchase_Order_Items (
    Purchase_Order_Item INT PRIMARY KEY,
    Purchase_Order_ID INT,
    Material_ID INT,
    Quantity DECIMAL(12,2),
    Unit_Price DECIMAL(12,2),
    FOREIGN KEY (Purchase_Order_ID) REFERENCES Purchase_Orders(Purchase_Order_ID),
    FOREIGN KEY (Material_ID) REFERENCES Materials(Material_ID),
    CHECK (Quantity > 0),
    CHECK (Unit_Price >= 0),
    UNIQUE KEY uq_po_material
        (Purchase_Order_ID, Material_ID)
);

-- CREATE DELIVERIES TABLE
CREATE TABLE Deliveries (
    Delivery_ID INT PRIMARY KEY,
    Purchase_Order_ID INT,
    Delivery_Date DATE,
    Delivery_Reference VARCHAR(100),
    Received_By INT,
    Status ENUM('Received','Partial','Rejected') NOT NULL DEFAULT 'Received',
    Notes TEXT,
    FOREIGN KEY (Purchase_Order_ID) REFERENCES Purchase_Orders(Purchase_Order_ID),
    FOREIGN KEY (Received_By) REFERENCES Employees(Employee_ID),
    INDEX idx_delivery_date (Delivery_Date),
    INDEX idx_delivery_po (Purchase_Order_ID)
);

-- CREATE DELIVERY ITEMS TABLE
CREATE TABLE Delivery_Items (
    Delivery_Item_ID INT PRIMARY KEY,
    Delivery_ID INT NOT NULL,
    Material_ID INT NOT NULL,
    Quantity_Delivered DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (Delivery_ID) REFERENCES Deliveries(Delivery_ID),
    FOREIGN KEY (Material_ID) REFERENCES Materials(Material_ID),
    CHECK (Quantity_Delivered > 0),
    UNIQUE KEY uq_delivery_material
        (Delivery_ID, Material_ID),
    INDEX idx_delivery_item_delivery (Delivery_ID),
    INDEX idx_delivery_item_material (Material_ID)
);

-- CREATE EQUIPMENTS TABLE
CREATE TABLE Equipments (
    Equipment_ID INT PRIMARY KEY,
    Equipment_Name VARCHAR(100),
    Equipment_Type VARCHAR(100),
    Registration_Number VARCHAR(100) UNIQUE,
    Availability_Status ENUM('Available','Allocated','Maintenance') NOT NULL DEFAULT 'Available',
    INDEX idx_equipment_status (Availability_Status)
);

-- CREATE EQUIPMENT ALLOCATIONS TABLE
CREATE TABLE Equipment_Allocations (
    Allocation_ID INT AUTO_INCREMENT PRIMARY KEY,
    Equipment_ID INT,
    Project_ID INT,
    Allocation_Start_Date DATE,
    Allocation_End_Date DATE,
    Purpose TEXT,
    Status ENUM('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
    CHECK ( Allocation_End_Date IS NULL OR Allocation_End_Date >= Allocation_Start_Date),
    FOREIGN KEY (Equipment_ID) REFERENCES Equipments(Equipment_ID),
    FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
    INDEX idx_allocation_project (Project_ID),
    INDEX idx_allocation_equipment (Equipment_ID),
    INDEX idx_allocation_status (Status)
);

-- PROJECT EMPLOYEES TABLE
CREATE TABLE Project_Employees (
    Project_Employee_ID INT PRIMARY KEY,
    Project_ID INT NOT NULL,
    Employee_ID INT NOT NULL,
    Assignment_Start_Date DATE NOT NULL,
    Assignment_End_Date DATE,
    Role VARCHAR(100),
    Status ENUM('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
    FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
    FOREIGN KEY (Employee_ID) REFERENCES Employees(Employee_ID),
    CHECK (Assignment_End_Date IS NULL OR Assignment_End_Date >= Assignment_Start_Date),
    UNIQUE (Project_ID, Employee_ID),
    INDEX idx_project_employee_project (Project_ID),
    INDEX idx_project_employee_employee (Employee_ID),
    INDEX idx_project_employee_status (Status)
);

-- 	CREATE PROJECT EXPENSES TABLE
CREATE TABLE Project_Expenses (
    Expense_ID INT AUTO_INCREMENT PRIMARY KEY,
    Project_ID INT,
    Expense_Date DATE,
    Expense_Category ENUM('Materials','Labour','Transport','Equipment','Other') NOT NULL,
    Description TEXT,
    Amount DECIMAL(14,2),
    FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
    CHECK (Amount >= 0),
    INDEX idx_project_expense_date
        (Project_ID, Expense_Date)
);

--  CREATE PAYMENTS TABLE
CREATE TABLE Payments (
    Payment_ID INT PRIMARY KEY,
    Supplier_ID INT,
    Purchase_Order_ID INT,
    Payment_Date DATE,
    Amount DECIMAL(14,2),
    Payment_Method ENUM('Cash','Bank Transfer','Mobile Money','Cheque') NOT NULL,
    Reference_Number VARCHAR(100),
    FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID),
    FOREIGN KEY (Purchase_Order_ID) REFERENCES Purchase_Orders(Purchase_Order_ID),
    CHECK (Amount >= 0),
    INDEX idx_payment_supplier (Supplier_ID),
    INDEX idx_payment_date (Payment_Date)
);

-- CLIENT SAMPLE DATA
INSERT INTO Clients (Client_ID, Client_Name, Phone_Number, Email, Address)
VALUES
(1,'Chongwe Property Developers','0771043314','info@cpd.com','Chongwe'),
(2,'Astro Valley Estates','0964842992','office@ave.co.zm','Ndola'),
(3,'Zambezi Agro Limited','0971043314','info@zal.co.zm','Zambezi South'),
(4,'Lusaka Housing Limited','0571648492','projects@lhl.com','Lusaka'),
(5,'Arcades Business Hub','0976445679','customer@abh.co.zm','Lusaka'),
(6,'Kabwe Secondary School','0957008955','Kabwess@gmail.com','Kabwe'),
(7,'Mpongwe City Council','0967543211','mpongwecc23@gmail.com','Mpongwe'),
(8,'Zambia Sugar','0956889078','info@zambiasugar.com','Mazabuka'),
(9,'Cavendish University Zambia','0772438081','cavendish@cavendish.co.zm','Lusaka'),
(10,'National Assembly of Zambia','+260 211 292425-36','info@parliament.gov.zm','Lusaka');

-- CONTRACTOR SAMPLE DATA
INSERT INTO Contractors (Contractor_ID, Contractor_Name, Phone_Number, Email, Address, License_Number)
VALUES
(1,'Zamforge Construction Limited','0571560005','info@zamforgeconstruction.com','Lusaka','LC-001'),
(2,'Neer Construction','0971084686','info@neerconstruction.com','Lusaka','LC-002'),
(3,'East to West Construction and Mining Ltd','0960773871','info@ewconstruction.co.zm','Ndola','LC-003'),
(4,'Omusiba Engineering and Suppliers Limited','0975525514','info@omusibaesl.co.zm','Mufulira','LC-004'),
(5,'Krutec Investments Limited','0955783961','info@krutec.com','Kitwe','LC-005'),
(6,'T A P Building Products Ltd','+260 21 622 1611','info@tapbuilding.com','Chipata','LC-006'),
(7,'Groutex Company Limited','0961222266','info@groutex.co.zm','Lusaka','LC-007'),
(8,'Treadstone Construction Limited','0965743087','info@treadstone.com','Lusaka','LC-008'),
(9,'Fabribuild Zambia Limited','0955761584','info@fabribuild.com','Mumbwa','LC-009'),
(10,'Heritage Home Construction','0770881651','info@heritage.co.zm','Kafue','LC-0010');

-- EMPLOYEE SAMPLE DATA
INSERT INTO Employees (Employee_ID, Employee_Name, Phone_Number, Email, Job_Title, Address, Hire_Date)
VALUES
(1,'Astro Phiri','0576888904','astrop@buildtrack.co.zm','Project Manager','Olympia Park','2020-07-01'),
(2,'Joseph Mulenga','0964783030','josephm@buildtrack.co.zm','Accounts Officer','Munali','2020-07-21'),
(3,'Sherine Chirwa','0775651132','sherinec@buildtrack.co.zm','Procurement Officer','Chalala','2020-08-01'),
(4,'James Hamasenya','0957800981','Jamesh@buildtrack.co.zm','Quantity Surveyor','Chamba Valley','2020-08-27'),
(5,'Tissa Kunda','0778116760','tissak@buildtrack.co.zm','Project Manager','Makeni Villa','2021-03-01'),
(6,'Olivia Malambo','0963336753','oliviam@buildtrack.co.zm','Quantity Surveyor','Chilanga','2021-08-25'),
(7,'Chibwe Mumba','0966787898','chibwem@buildtrack.co.zm','Procurement Officer','Libala','2021-10-01'),
(8,'Dalitso Banda','0978677432','dalitsob@buildtrack.co.zm','Project Manager','Kabwata','2021-12-03'),
(9,'Mercy Mtonga','0956785566','mercym@buildtrack.co.zm','Help Desk','Roma Park','2022-01-01'),
(10,'Prince Lubinda','0959871122','princel@buildtrack.co.zm','Accounts Officer','Northmead','2022-04-15');

-- PROJECT SAMPLE DATA
INSERT INTO Projects (Project_ID,Client_ID,Contractor_ID,Project_Manager_ID,Project_Name,Project_Description,Start_Date,Expected_End_Date,Actual_End_Date,Project_Status,Project_Budget)
VALUES
(1,1,2,1,'Chongwe Apartments','Construction of Apartment Units','2024-05-10','2024-10-20','2024-11-08','Completed',85000),
(2,2,3,5,'Astro Housing Unit', 'Construction of Housing Units','2024-05-25','2024-12-10','2025-02-05','Completed',50000),
(3,3,10,8,'Zambezi Storage Facility','Construction of Agricultural Storage Facility','2024-07-12','2025-01-03','2025-02-10','Completed',100000),
(4,4,8,1,'Lusaka Housing Properties','Rehabilitation of Lusaka Housing Properties','2024-12-29','2025-03-21','2025-04-18', 'Completed',120000),
(5,5,7,5,'Arcades Offices','Maintenance of Arcades Offices','2025-03-01','2025-04-26','2025-05-01','Completed',500000),
(6,6,9,8,'Kabwe School Block','Construction of a New Classroom Block','2025-05-01','2025-09-12','2025-09-30','Completed',110000),
(7,7,4,8,'New Mpongwe Council Building','Construction of Mpongwe Council Building','2026-01-09','2026-11-25',NULL,'Active',60000),
(8,8,1,5,'Zambia Sugar Facility','Construction of New Zambia Sugar Facility','2026-02-04','2027-02-04',NULL,'Active',50000),
(9,9,5,1,'School of Business Campus','Construction of a School of Business Campus','2026-12-09','2028-12-10',NULL,'Planned',55000),
(10,10,6,5, 'National Assembly Library','Rehabilitation of National Assembly Library','2027-01-01','2028-05-01',NULL,'Planned',90000);

-- SUPPLIERS SAMPLE DATA
INSERT INTO Suppliers (Supplier_ID, Supplier_Name, Phone_Number, Email, Address)
VALUES
(1,'Lafarge Zambia','0978757587','sales@lafarge.co.zm','Chilanga'),
(2,'Afri Blocks Ltd','0967546578','sales@afriblocks.co.zm','Lusaka'),
(3,'Zed Paint Ltd','0578909098','sales@zedpaintl.com','Ndola'),
(4,'BuildChem Ltd','0777664454','sales@buildchem.co.zm','Lusaka'),
(5,'Sand Doctors','0964443331','sales@safetyfc.com','Kabwe'),
(6,'A & A Electricals','0979001177','sales@aaelectricals.com','Kafue'),
(7,'Zed Furnitures Ltd','0567009878','sales@zedfurnitures.co.zm','Lusaka'),
(8,'Aluminium and Steel Zambia','0764433212','sales@alusteel.com','Livingstone'),
(9,'Plumb Zed Ltd','0775636671','sales@plumbzed.co.zm','Chipata'),
(10,'Timber Zambia','0956333121','sales@timber.com','Kapiri Mposhi');

-- MATERIALS SAMPLE DATA
INSERT INTO Materials (Material_ID, Material_Name, Unit, Unit_Price, Stock_Quantity, Reorder_Level)
VALUES
(1,'River Sand','Tonne',550,150,25),
(2,'Building Blocks','Piece',8.50,5000,1000),
(3,'Cement','50KG Bag',125,500,100),
(4,'Chemicals','20L Bucket',650,120,25),
(5,'Timber','Piece',95,400,80),
(6,'Interior Paint','20L Bucket',950,100,20),
(7,'Roofing Sheet','Piece',180,300,60),
(8,'PVC Pipe','Length',75,500,100),
(9,'Furniture','Piece',1500,300,30),
(10,'Electrical Cable','Roll',750,100,20);

-- PURCHASE ORDERS SAMPLE DATA
INSERT INTO Purchase_Orders ( Purchase_Order_ID, Project_ID, Supplier_ID, Order_Date, Expected_Delivery_Date, Status,Total_Amount)
VALUES
(1,1,1,'2024-04-10','2024-05-03','Delivered',62500),
(2,2,10,'2025-03-01','2025-05-10','Delivered',38000),
(3,3,4,'2024-06-01','2024-06-30','Delivered',78000),
(4,4,5,'2024-10-01','2024-11-26','Delivered',82500),
(5,5,7,'2025-02-05','2025-02-26','Delivered',450000),
(6,6,3,'2025-07-10','2025-08-30','Delivered',95000),
(7,7,8,'2026-07-30','2026-10-26','Approved',54000),
(8,8,9,'2026-09-19','2026-11-19','Approved',37500),
(9,9,2,'2026-10-30','2027-01-25','Draft',42500),
(10,10,6,'2026-11-01','2027-06-01','Draft',75000);

-- PURCHASE ORDER ITEMS
INSERT INTO Purchase_Order_Items (Purchase_Order_Item, Purchase_Order_ID, Material_ID, Quantity, Unit_Price)
VALUES
(1,1,3,500,125),
(2,2,5,400,95),
(3,3,4,120,650),
(4,4,1,150,550),
(5,5,9,300,1500),
(6,6,6,100,950),
(7,7,7,300,180),
(8,8,8,500,75),
(9,9,2,5000,8.50),
(10,10,10,100,750);

-- DELIVERIES
INSERT INTO Deliveries ( Delivery_ID, Purchase_Order_ID, Delivery_Date, Delivery_Reference, Received_By, Status,Notes)
VALUES
(1,1,'2024-05-03','DEL-001',3,'Received','Cement delivered'),
(2,2,'2025-05-10','DEL-002',3,'Received','Timber delivered'),
(3,3,'2024-06-30','DEL-003',7,'Received','Chemicals delivered'),
(4,4,'2024-11-26','DEL-004',7,'Received','River Sand Delivered'),
(5,5,'2025-02-26','DEL-005',3,'Received','Furniture Delivered'),
(6,6,'2025-08-30','DEL-006',3,'Received','Interior Paint Delivered');

-- DELIVERY ITEMS
INSERT INTO Delivery_Items ( Delivery_Item_ID, Delivery_ID, Material_ID, Quantity_Delivered)
VALUES
(1,1,3,500),
(2,2,5,400),
(3,3,4,120),
(4,4,1,150),
(5,5,9,300),
(6,6,6,100);

-- EQUIPMENT SAMPLE DATA
INSERT INTO Equipments ( Equipment_ID, Equipment_Name, Equipment_Type, Registration_Number,Availability_Status)
VALUES
(1,'CAT Generator','Generator','GEN-001','Available'),
(2,'Honda Concrete Mixer','Concrete Mixer','MIX-001','Available'),
(3,'Toyota Hilux','Vehicle','VH-001','Available'),
(4,'Caterpillar Excavator','Excavator','EXC-001','Available'),
(5,'JCB Backhoe Loader','Backhoe','JCB-001','Allocated'),
(6,'Scaffolding Set A','Scaffolding','SCA-001','Available'),
(7,'Mobile Crane','Crane','CRN-001','Allocated'),
(8,'Plate Compactor','Compactor','CMP-001','Maintenance'),
(9,'Water Bowser','Vehicle','WTR-001','Available'),
(10,'Site Office Container','Site Facility','SOC-001','Available');

-- EQUIPMENT ALLOCATIONS
INSERT INTO Equipment_Allocations ( Allocation_ID, Equipment_ID, Project_ID, Allocation_Start_Date, Allocation_End_Date,Purpose, Status)
VALUES
(1,3,1,'2024-05-10','2024-10-20','Transporting materials to site','Completed'),
(2,4,2,'2024-05-25','2024-12-10','Excavation work for foundation','Completed'),
(3,6,3,'2024-07-12','2025-01-03','Scaffolding for construction work','Completed'),
(4,9,4,'2024-12-29','2025-03-21','Water supply for construction site','Completed'),
(5,1,5,'2025-03-01','2025-04-26','Power supply for construction site','Completed'),
(6,2,6,'2025-05-01','2025-09-12','Mixing concrete for construction work','Completed'),
(7,5,7,'2026-01-09',NULL,'Backhoe work for excavation and landscaping','Active'),
(8,7,8,'2026-02-04',NULL,'Lifting heavy materials and equipment on site','Active');

-- PROJECT EXPENSES
INSERT INTO Project_Expenses ( Expense_ID, Project_ID, Expense_Date, Expense_Category, Description, Amount)
VALUES
(1,1,'2024-05-15','Materials','Purchase of cement and sand',62500),
(2,2,'2025-03-10','Labour','Payment for construction workers',38000),
(3,3,'2024-07-20','Transport','Transportation of materials to site',78000),
(4,4,'2024-11-01','Equipment', 'Rental of excavator for foundation work',82500),
(5,5,'2025-02-15','Materials','Purchase of furniture for offices',450000),
(6,6,'2025-08-05','Labour','Payment for construction workers',95000);

-- PAYMENTS
INSERT INTO Payments ( Payment_ID, Supplier_ID, Purchase_Order_ID, Payment_Date, Amount, Payment_Method,Reference_Number
)
VALUES
(1,1,1,'2024-05-05',62500,'Bank Transfer','PAY-001'),
(2,10,2,'2025-05-12',38000,'Cash','PAY-002'),
(3,4,3,'2024-07-01',78000,'Mobile Money','PAY-003'),
(4,5,4,'2024-11-05',82500,'Cheque','PAY-004'),
(5,7,5,'2025-02-28',450000,'Bank Transfer','PAY-005'),
(6,3,6,'2025-09-01',95000,'Cash','PAY-006');

-- PROJECT EMPLOYEE ASSIGNMENTS
INSERT INTO Project_Employees ( Project_Employee_ID, Project_ID, Employee_ID, Assignment_Start_Date, Assignment_End_Date, Role, Status )
VALUES
(1,1,1,'2024-05-10','2024-11-08','Project Manager','Completed'),
(2,1,4,'2024-05-10','2024-11-08','Quantity Surveyor','Completed'),
(3,2,5,'2024-05-25','2025-02-05','Project Manager','Completed'),
(4,2,2,'2024-05-25','2025-02-05','Accounts Officer','Completed'),
(5,3,8,'2024-07-12','2025-02-10','Project Manager','Completed'),
(6,3,3,'2024-07-12','2025-02-10','Procurement Officer','Completed'),
(7,4,1,'2024-12-29','2025-04-18','Project Manager','Completed'),
(8,4,6,'2024-12-29','2025-04-18','Quantity Surveyor','Completed'),
(9,5,5,'2025-03-01','2025-05-01','Project Manager','Completed'),
(10,5,7,'2025-03-01','2025-05-01','Procurement Officer','Completed'),
(11,6,8,'2025-05-01','2025-09-30','Project Manager','Completed'),
(12,6,4,'2025-05-01','2025-09-30','Quantity Surveyor','Completed'),
(13,7,8,'2026-01-09',NULL,'Project Manager','Active'),
(14,7,3,'2026-01-09',NULL,'Procurement Officer','Active'),
(15,8,5,'2026-02-04',NULL,'Project Manager','Active'),
(16,8,6,'2026-02-04',NULL,'Quantity Surveyor','Active'),
(17,9,1,'2026-12-09',NULL,'Project Manager','Active'),
(18,9,2,'2026-12-09',NULL,'Accounts Officer','Active'),
(19,10,5,'2027-01-01',NULL,'Project Manager','Active'),
(20,10,7,'2027-01-01',NULL,'Procurement Officer','Active');

-- VIEW PROJECT EXPENDITURE VS BUDGET
CREATE OR REPLACE VIEW vw_project_expenditure AS
SELECT
    p.Project_ID,
    p.Project_Name,
    p.Project_Budget,
    COALESCE(SUM(e.Amount),0) AS TotalExpenditure,
    p.Project_Budget -
    COALESCE(SUM(e.Amount),0) AS RemainingExpenditure,
    ROUND(
        (
            COALESCE(SUM(e.Amount),0)
            / NULLIF(p.Project_Budget,0)
        ) * 100,
        2
    ) AS BudgetUsedPercentage
FROM Projects p
LEFT JOIN Project_Expenses e
    ON p.Project_ID = e.Project_ID
GROUP BY
    p.Project_ID,
    p.Project_Name,
    p.Project_Budget;

-- VIEW CURRENTLY ASSIGNED EQUIPMENT
CREATE OR REPLACE VIEW vw_equipment_currently_assigned AS
SELECT
    ea.Allocation_ID,
    eq.Equipment_ID,
    eq.Equipment_Name,
    eq.Equipment_Type,
    p.Project_ID,
    p.Project_Name,
    ea.Allocation_Start_Date,
    ea.Allocation_End_Date,
    ea.Purpose,
    ea.Status
FROM Equipment_Allocations ea
INNER JOIN Equipments eq
    ON ea.Equipment_ID = eq.Equipment_ID
INNER JOIN Projects p
    ON ea.Project_ID = p.Project_ID
WHERE ea.Status = 'Active';

-- VIEW SUPPLIER ACTIVITY
CREATE OR REPLACE VIEW vw_supplier_activity AS
SELECT
    s.Supplier_ID,
    s.Supplier_Name,
    COUNT(DISTINCT po.Purchase_Order_ID)
        AS Purchase_Orders,
    COALESCE(SUM(po.Total_Amount),0)
        AS OrderedValue,
    COALESCE(
        (
            SELECT SUM(pay.Amount)
            FROM Payments pay
            WHERE pay.Supplier_ID = s.Supplier_ID
        ),
        0
    ) AS PaidValue
FROM Suppliers s
LEFT JOIN Purchase_Orders po
    ON s.Supplier_ID = po.Supplier_ID
GROUP BY
    s.Supplier_ID,
    s.Supplier_Name;

-- VIEW SUPPLIER BALANCE
CREATE OR REPLACE VIEW vw_supplier_balance AS
SELECT
    s.Supplier_ID,
    s.Supplier_Name,
    COALESCE(po.TotalOrdered,0)
        AS TotalOrdered,
    COALESCE(pay.TotalPaid,0)
        AS TotalPaid,
    COALESCE(po.TotalOrdered,0)
    - COALESCE(pay.TotalPaid,0)
        AS OutstandingBalance
FROM Suppliers s
LEFT JOIN
(
    SELECT
        Supplier_ID,
        SUM(Total_Amount) AS TotalOrdered
    FROM Purchase_Orders
    GROUP BY Supplier_ID
) po
ON s.Supplier_ID = po.Supplier_ID
LEFT JOIN
(
    SELECT
        Supplier_ID,
        SUM(Amount) AS TotalPaid
    FROM Payments
    GROUP BY Supplier_ID
) pay
ON s.Supplier_ID = pay.Supplier_ID;

-- STORED PROCEDURE / ADD PROJECT EXPENSE
DELIMITER //
DROP PROCEDURE IF EXISTS sp_add_project_expense//
CREATE PROCEDURE sp_add_project_expense
(
    IN p_project_id INT,
    IN p_expense_date DATE,
    IN p_category VARCHAR(30),
    IN p_description TEXT,
    IN p_amount DECIMAL(14,2)
)
BEGIN
     DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    IF NOT EXISTS
    (
        SELECT 1
        FROM Projects
        WHERE Project_ID = p_project_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project does not exist';
    END IF;
    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Expense amount must be greater than zero';
    END IF;
    START TRANSACTION;
    INSERT INTO Project_Expenses (Project_ID, Expense_Date, Expense_Category, Description, Amount)
    VALUES
    (p_project_id, p_expense_date, p_category, p_description,p_amount);
    COMMIT;
END//
DELIMITER ;

-- STORED PROCEDURE / ALLOCATE EQUIPMENT / TRANSACTION + ROLLBACK
DELIMITER //
DROP PROCEDURE IF EXISTS sp_allocate_equipment//
CREATE PROCEDURE sp_allocate_equipment
(
    IN p_equipment_id INT,
    IN p_project_id INT,
    IN p_start DATE,
    IN p_end DATE,
    IN p_purpose TEXT
)
BEGIN
    DECLARE v_equipment_status VARCHAR(20);
    DECLARE v_equipment_exists INT DEFAULT 0;
    DECLARE v_project_exists INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    -- Check project
    SELECT COUNT(*)
    INTO v_project_exists
    FROM Projects
    WHERE Project_ID = p_project_id;
    IF v_project_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project does not exist';
    END IF;
    -- Check and lock equipment row
    SELECT COUNT(*)
    INTO v_equipment_exists
    FROM Equipments
    WHERE Equipment_ID = p_equipment_id;

    IF v_equipment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Equipment does not exist';
    END IF;

    SELECT Availability_Status
    INTO v_equipment_status
    FROM Equipments
    WHERE Equipment_ID = p_equipment_id
    FOR UPDATE;
    IF v_equipment_status <> 'Available' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Equipment is not available for allocation';
    END IF;
    IF p_end IS NOT NULL
       AND p_end < p_start THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'End date cannot be before start date';
    END IF;
    -- Insert allocation
    INSERT INTO Equipment_Allocations (Equipment_ID, Project_ID, Allocation_Start_Date, Allocation_End_Date, Purpose,Status)
    VALUES
    ( p_equipment_id, p_project_id, p_start,p_end, p_purpose,'Active');
    -- Update equipment status
    UPDATE Equipments
    SET Availability_Status = 'Allocated'
    WHERE Equipment_ID = p_equipment_id;
    COMMIT;
END//
DELIMITER ;

-- REQUIRED DEMONSTRATION QUERIES
-- INNER JOIN PROJECTS WITH CLIENTS
SELECT
    p.Project_ID,
    p.Project_Name,
    c.Client_Name,
    p.Project_Status,
    p.Project_Budget
FROM Projects p
INNER JOIN Clients c
    ON p.Client_ID = c.Client_ID;

-- INNER JOIN PROJECTS WITH PROJECT MANAGERS
SELECT
    p.Project_Name,
    e.Employee_Name AS Project_Manager,
    e.Job_Title
FROM Projects p
INNER JOIN Employees e
    ON p.Project_Manager_ID = e.Employee_ID;

-- LEFT JOIN ALL CLIENTS AND THEIR PROJECTS
SELECT
    c.Client_Name,
    p.Project_Name,
    p.Project_Status
FROM Clients c
LEFT JOIN Projects p
    ON c.Client_ID = p.Client_ID;

-- MATERIALS PURCHASED BY PROJECT
SELECT
    p.Project_Name,
    m.Material_Name,
    poi.Quantity,
    poi.Unit_Price,
    (poi.Quantity * poi.Unit_Price) AS TotalCost
FROM Projects p
INNER JOIN Purchase_Orders po
    ON p.Project_ID = po.Project_ID
INNER JOIN Purchase_Order_Items poi
    ON po.Purchase_Order_ID = poi.Purchase_Order_ID
INNER JOIN Materials m
    ON poi.Material_ID = m.Material_ID
ORDER BY p.Project_Name;

-- MATERIALS DELIVERED BY PROJECT
SELECT
    p.Project_Name,
    m.Material_Name,
    di.Quantity_Delivered,
    d.Delivery_Date,
    d.Delivery_Reference
FROM Projects p
INNER JOIN Purchase_Orders po
    ON p.Project_ID = po.Project_ID
INNER JOIN Deliveries d
    ON po.Purchase_Order_ID = d.Purchase_Order_ID
INNER JOIN Delivery_Items di
    ON d.Delivery_ID = di.Delivery_ID
INNER JOIN Materials m
    ON di.Material_ID = m.Material_ID
ORDER BY d.Delivery_Date;

-- TOTAL EXPENSES BY PROJECT
SELECT
    p.Project_ID,
    p.Project_Name,
    COALESCE(SUM(e.Amount),0) AS TotalExpenses
FROM Projects p
LEFT JOIN Project_Expenses e
    ON p.Project_ID = e.Project_ID
GROUP BY
    p.Project_ID,
    p.Project_Name
ORDER BY TotalExpenses DESC;

-- EXPENSES BY CATEGORY
SELECT
    Expense_Category,
    COUNT(*) AS NumberOfExpenses,
    SUM(Amount) AS TotalAmount
FROM Project_Expenses
GROUP BY Expense_Category
ORDER BY TotalAmount DESC;

-- PROJECTS ABOVE AVERAGE BUDGET
SELECT
    Project_ID,
    Project_Name,
    Project_Budget
FROM Projects
WHERE Project_Budget >
(
    SELECT AVG(Project_Budget)
    FROM Projects
);

-- PROJECTS APPROACHING OR EXCEEDING BUDGET
SELECT
    Project_ID,
    Project_Name,
    Project_Budget,
    TotalExpenditure,
    RemainingExpenditure,
    BudgetUsedPercentage
FROM vw_project_expenditure
WHERE BudgetUsedPercentage >= 80
ORDER BY BudgetUsedPercentage DESC;

-- PROJECTS THAT HAVE EXCEEDED BUDGET
SELECT
    Project_ID,
    Project_Name,
    Project_Budget,
    TotalExpenditure,
    RemainingExpenditure
FROM vw_project_expenditure
WHERE TotalExpenditure > Project_Budget;

-- CURRENT EQUIPMENT ASSIGNMENTS
SELECT *
FROM vw_equipment_currently_assigned;

-- SUPPLIER ACTIVITY
SELECT *
FROM vw_supplier_activity
ORDER BY OrderedValue DESC;

-- SUPPLIER BALANCE
SELECT *
FROM vw_supplier_balance
ORDER BY OutstandingBalance DESC;

-- EMPLOYEES ASSIGNED TO PROJECTS
SELECT
    p.Project_Name,
    e.Employee_Name,
    e.Job_Title,
    pe.Role,
    pe.Status
FROM Project_Employees pe
INNER JOIN Projects p
    ON pe.Project_ID = p.Project_ID
INNER JOIN Employees e
    ON pe.Employee_ID = e.Employee_ID
ORDER BY p.Project_Name;

-- ACTIVE EMPLOYEES ON PROJECTS
SELECT
    p.Project_Name,
    e.Employee_Name,
    pe.Role
FROM Project_Employees pe
INNER JOIN Projects p
    ON pe.Project_ID = p.Project_ID
INNER JOIN Employees e
    ON pe.Employee_ID = e.Employee_ID
WHERE pe.Status = 'Active';

-- MATERIALS BELOW REORDER LEVEL
SELECT
    Material_ID,
    Material_Name,
    Stock_Quantity,
    Reorder_Level
FROM Materials
WHERE Stock_Quantity <= Reorder_Level;

-- PROJECT STATUS REPORT
SELECT
    Project_Status,
    COUNT(*) AS NumberOfProjects
FROM Projects
GROUP BY Project_Status;

-- PURCHASE ORDER TOTALS BY SUPPLIER
SELECT
    s.Supplier_Name,
    COUNT(po.Purchase_Order_ID) AS NumberOfOrders,
    SUM(po.Total_Amount) AS TotalOrderValue
FROM Suppliers s
LEFT JOIN Purchase_Orders po
    ON s.Supplier_ID = po.Supplier_ID
GROUP BY
    s.Supplier_ID,
    s.Supplier_Name
ORDER BY TotalOrderValue DESC;

-- EQUIPMENT STATUS REPORT
SELECT
    Availability_Status,
    COUNT(*) AS NumberOfEquipment
FROM Equipments
GROUP BY Availability_Status;

-- PROJECT BUDGET REPORT
SELECT
    Project_ID,
    Project_Name,
    Project_Budget,
    TotalExpenditure,
    RemainingExpenditure,
    BudgetUsedPercentage
FROM vw_project_expenditure
ORDER BY BudgetUsedPercentage DESC;

-- DATABASE SECURITY
CREATE USER IF NOT EXISTS
'buildtrack_app'@'localhost'
IDENTIFIED BY 'Astro150018#';

GRANT
SELECT,
INSERT,
UPDATE,
DELETE
ON BuildTrackDB.*
TO 'buildtrack_app'@'localhost';

FLUSH PRIVILEGES;

SHOW GRANTS FOR
'buildtrack_app'@'localhost';
