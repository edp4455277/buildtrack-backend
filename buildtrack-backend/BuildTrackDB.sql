-- Active: 1785663082958@@localhost@3306@buildtrackdb
-- database for buildtrack construction 

DROP DATABASE IF EXISTS BuildTrackDB;
-- create database 
CREATE DATABASE BuildTrackDB;

USE BuildTrackDB;

-- create table for clients
CREATE TABLE Clients (
Client_ID INT PRIMARY KEY,
Client_Name VARCHAR(100),
Phone_Number varchar(30),
Email VARCHAR(100) UNIQUE,
Address VARCHAR(100),
INDEX idx_client_name (Client_Name)
);

-- create table for contractors
CREATE TABLE Contractors (
Contractor_ID INT PRIMARY KEY,
Contractor_Name VARCHAR(100),
Phone_Number VARCHAR(30),
Email VARCHAR(100) UNIQUE,
Address VARCHAR(100),
License_Number VARCHAR(50) UNIQUE,
INDEX idx_contractor_name (Contractor_Name)
);

-- create table for employees 
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

-- create table for projects
CREATE TABLE Projects (
Project_ID INT PRIMARY KEY,
Client_ID INT,
Contractor_ID INT,
Project_Manager_ID INT,
Project_Name VARCHAR(100),
Project_Location VARCHAR(150),
Project_Description TEXT,
Start_Date DATE,
Expected_End_Date DATE,
Actual_End_Date DATE,
Project_Status ENUM('Planned', 'Active', 'Completed', 'On Hold', 'Cancelled') NOT NULL DEFAULT 'Planned',
Project_Budget DECIMAL(14,2),
Project_Total_Expenditure DECIMAL(14,2) NOT NULL DEFAULT 0.00,
FOREIGN KEY (Client_ID) REFERENCES Clients(Client_ID),
FOREIGN KEY (Contractor_ID) REFERENCES Contractors(Contractor_ID),
FOREIGN KEY (Project_Manager_ID) REFERENCES Employees(Employee_ID),
CHECK (Project_Budget >= 0),
CHECK (Expected_End_Date IS NULL OR Start_Date IS NULL OR Expected_End_Date >= Start_Date),
INDEX idx_project_name (Project_Name),
INDEX idx_project_status (Project_Status),
INDEX idx_project_client (Client_ID)
);

-- create table for suppliers
CREATE TABLE Suppliers (
Supplier_ID INT PRIMARY KEY,
Supplier_Name VARCHAR(100),
Service_Type VARCHAR(150),
Phone_Number VARCHAR(30),
Email VARCHAR(100) UNIQUE,
Address VARCHAR(100),
Balance_Due DECIMAL(14,2) NOT NULL DEFAULT 0.00,
INDEX idx_supplier_name (Supplier_Name)
);

-- create table materials
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

-- create table for purchase_orders
CREATE TABLE Purchase_Orders (
Purchase_Order_ID INT PRIMARY KEY,
Project_ID INT,
Supplier_ID INT,
Order_Date DATE,
Expected_Delivery_Date DATE,
Status ENUM('Draft', 'Approved', 'Partially Delivered', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Draft',
Total_Amount DECIMAL(14,2),
FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID),
CHECK (Total_Amount >= 0),
INDEX idx_po_project (Project_ID),
INDEX idx_po_supplier (Supplier_ID),
INDEX idx_po_date (Order_Date)
);

-- create table for purchase_order_items
CREATE TABLE Purchase_Order_Items (
Purchase_Order_Item INT PRIMARY KEY,
Purchase_Order_ID INT,
Material_ID INT,
Quantity DECIMAL(12,2),
Unit_Price DECIMAL(12,2),
FOREIGN KEY (Purchase_Order_ID) REFERENCES Purchase_Orders(Purchase_Order_ID),
FOREIGN KEY (Material_ID) REFERENCES Materials(Material_ID),
CHECK (Quantity >= 0),
CHECK (Unit_Price >= 0),
UNIQUE KEY uq_po_material (Purchase_Order_ID, Material_ID)
);

-- create table for deliveries
CREATE TABLE Deliveries (
Delivery_ID INT PRIMARY KEY,
Purchase_Order_ID INT,
Delivery_Date DATE,
Delivery_Reference VARCHAR(100),
Received_By INT,
Status ENUM('Received', 'Partial', 'Rejected') NOT NULL DEFAULT 'Received',
Notes TEXT,
FOREIGN KEY  (Purchase_Order_ID)  REFERENCES Purchase_Orders(Purchase_Order_ID),
FOREIGN KEY (Received_By) REFERENCES Employees(Employee_ID),
INDEX idx_delivery_date (Delivery_Date),
INDEX idx_delivery_po (Purchase_Order_ID) 
);

-- create table for equipments
CREATE TABLE Equipments (
Equipment_ID INT PRIMARY KEY,
Equipment_Name VARCHAR(100),
Equipment_Type VARCHAR(100),
Registration_Number VARCHAR(100) UNIQUE,
Availability_Status ENUM('Available', 'Allocated', 'Maintenance') NOT NULL DEFAULT 'Available',
Assigned_Project_ID INT NULL,
FOREIGN KEY (Assigned_Project_ID) REFERENCES Projects(Project_ID),
INDEX idx_equipment_status (Availability_Status)
);


-- create table for equipment_allocations
CREATE TABLE Equipment_Allocations (
Allocation_ID INT PRIMARY KEY,
Equipment_ID INT,
Project_ID INT,
Allocation_Start_Date DATE,
Allocation_End_Date DATE,
Purpose TEXT,
Status ENUM('Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
CHECK (Allocation_End_Date IS NULL OR Allocation_End_Date >= Allocation_Start_Date),
FOREIGN KEY (Equipment_ID) REFERENCES  Equipments(Equipment_ID),
FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
INDEX idx_allocation_project (Project_ID),
INDEX idx_allocation_equipment (Equipment_ID)
);

-- create table for project_expenses
CREATE TABLE Project_Expenses (
Expense_ID INT PRIMARY KEY,
Project_ID INT,
Expense_Date DATE,
Expense_Category ENUM('Materials', 'Labour', 'Transport', 'Equipment', 'Other') NOT NULL,
Description TEXT,
Amount DECIMAL(14,2),
FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID),
CHECK (Amount >= 0),
INDEX idx_project_expense_date (Project_ID, Expense_Date)
);

-- create table for payments
CREATE TABLE Payments (
Payment_ID INT PRIMARY KEY,
Supplier_ID INT,
Purchase_Order_ID INT,
Payment_Date DATE,
Amount DECIMAL(14,2),
Payment_Method ENUM('Cash', 'Bank Transfer', 'Mobile Money', 'Cheque') NOT NULL,
Reference_Number VARCHAR(100),
FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID),
FOREIGN KEY (Purchase_Order_ID) REFERENCES Purchase_Orders(Purchase_Order_ID),
CHECK (Amount >= 0),
INDEX idx_payment_supplier (Supplier_ID),
INDEX idx_payment_date (Payment_Date)
);

-- USEFUL VIEWS 
CREATE OR REPLACE VIEW vw_project_expenditure AS 
SELECT p.Project_ID, p.Project_Name, p.Project_Budget,
       COALESCE(SUM(e.Amount), 0) AS TotalExpenditure,
       p.Project_Budget - COALESCE(SUM(e.Amount), 0) AS RemainingExpenditure,
       ROUND((COALESCE(SUM(e.Amount), 0)/ NULLIF(p.Project_Budget, 0)) *100,2)  AS BudgetUsedPercentage
 FROM Projects p  
 LEFT JOIN Project_Expenses e ON p.Project_ID = e.Project_ID
 GROUP BY p.Project_ID, p.Project_Name, p.Project_Budget;
 
 CREATE OR REPLACE VIEW vw_equipment_currently_assigned AS 
 SELECT ea.Allocation_ID, eq.Equipment_ID, eq.Equipment_Name,
        p.Project_ID, p.Project_Name, ea.Allocation_Start_Date, ea.Allocation_End_Date, ea.Status
FROM Equipment_Allocations ea
JOIN Equipments eq ON ea.Equipment_ID = eq.Equipment_ID
JOIN Projects p ON ea.Project_ID = p.Project_ID
WHERE ea.Status = 'Active';

CREATE OR REPLACE VIEW vw_supplier_activity AS
SELECT s.Supplier_ID, s.Supplier_Name,
       COUNT(DISTINCT po.Purchase_Order_ID) AS Purchase_Orders,
       COALESCE(SUM(po.Total_Amount), 0) AS OrderedValue,
       COALESCE((SELECT SUM(pay.Amount) FROM Payments pay WHERE pay.Supplier_ID = s.Supplier_ID), 0) AS PaidValue
FROM Suppliers s
LEFT JOIN Purchase_Orders po ON s.Supplier_ID = po.Supplier_ID
GROUP BY s.Supplier_ID, s.Supplier_Name;  

-- STORED PROCEDURE


DROP PROCEDURE IF EXISTS sp_add_project_expense;

CREATE PROCEDURE sp_add_project_expense (
    IN p_project_id INT,
    IN p_expense_date DATE,
    IN p_category VARCHAR(30),
    IN p_description TEXT,
    IN p_amount DECIMAL(14,2)
)
INSERT INTO Project_Expenses
    (Project_ID, Expense_Date, Expense_Category, Description, Amount)
SELECT
    p_project_id,
    p_expense_date,
    p_category,
    p_description,
    p_amount
FROM DUAL
WHERE EXISTS (
    SELECT 1
    FROM Projects
    WHERE Project_ID = p_project_id
)
AND p_amount > 0;


DROP PROCEDURE IF EXISTS sp_allocate_equipment;

CREATE PROCEDURE sp_allocate_equipment (
    IN p_equipment_id INT,
    IN p_project_id INT,
    IN p_start DATE,
    IN p_end DATE,
    IN p_purpose TEXT
)
INSERT INTO Equipment_Allocations
    (Equipment_ID,
     Project_ID,
     Allocation_Start_Date,
     Allocation_End_Date,
     Purpose,
     Status)
SELECT
    eq.Equipment_ID,
    p.Project_ID,
    p_start,
    p_end,
    p_purpose,
    'Active'
FROM Equipments eq
JOIN Projects p
    ON p.Project_ID = p_project_id
WHERE eq.Equipment_ID = p_equipment_id
  AND eq.Availability_Status = 'Available';


-- Update equipment status automatically after allocation

DROP TRIGGER IF EXISTS trg_equipment_allocation_set_allocated;

CREATE TRIGGER trg_equipment_allocation_set_allocated
AFTER INSERT ON Equipment_Allocations
FOR EACH ROW
UPDATE Equipments
SET Availability_Status = 'Allocated'
WHERE Equipment_ID = NEW.Equipment_ID;


INSERT INTO Clients(Client_ID, Client_Name, Phone_Number, Email, Address)
VALUES
(1,'Chongwe Property Developers', '0771043314', 'info@cpd.com', 'Chongwe'),
(2,'Astro Valley Estates', '0964842992', 'office@ave.co.zm', 'Ndola'),
(3, 'Zambezi Agro Limited', '0971043314', 'info@zal.co.zm', 'Zambezi South'),
(4, 'Lusaka Housing Limited', '0571648492', 'projects@lhl.com', 'Lusaka'),
(5, 'Arcades Business Hub', '0976445679', 'customer@abh.co.zm', 'Lusaka'),
(6, 'Kabwe Secondary School', '0957008955','Kabwess@gmail.com', 'Kabwe'),
(7, 'Mpongwe City Council', '0967543211', 'mpongwecc23@gmail.com', 'Mpongwe'),
(8, 'Zambia Sugar', '0956889078', 'info@zambiasugar.com', 'Mazabuka'),
(9, 'Cavendish University Zambia','0772438081', 'cavendish@cavendish.co.zm', 'Lusaka'),
(10, 'National Assembly of Zambia','+260 211 292425-36', 'info@parliament.gov.zm', 'Lusaka');

INSERT INTO Contractors(Contractor_ID, Contractor_Name, Phone_Number, Email, Address, License_Number)
VALUES
(1, 'Zamforge Construction Limited', '0571560005', 'info@zamforgeconstruction.com','Lusaka', 'LC-001'),
(2, 'Neer Construction', '0971084686', 'info@neerconstruction.com', 'Lusaka', 'Lc-002'),
(3, 'East to West Construction and Mining lt','0960773871','info@ewconstruction.co.zm','Ndola', 'LC-003'),
(4, 'Omusiba Engineering and Suppliers Limited', '0975525514', 'info@omusibaesl.co.zm', 'Mufulira', 'LC-004'),
(5, 'Krutec Investments Limited', '0955783961', 'info@krutec.com','Kitwe','LC-005'),
(6, 'T A P Building Products Ltd','+260 21 622 1611', 'info@tapbuilding.com','Chipata','LC-006'),
(7, 'Groutex Company Limited', '0961222266', 'info@groutex.co.zm', 'Lusaka', 'LC-007'),
(8, 'Treadstone Construction Limited', '0965743087', 'info@treadstone.com', 'Lusaka', 'LC-008'),
(9, 'Fabribuild Zambia Limited', '0955761584', 'info@fabribuild.com', 'Mumbwa', 'LC-009'),
(10, 'Heritage Home Construction', '0770881651', 'info@heritage.co.zm', 'Kafue', 'LC-0010');

INSERT INTO Employees(Employee_ID, Employee_Name, Phone_Number, Email, Job_Title, Address, Hire_Date)
VALUES
(1, 'Astro Phiri', '0576888904', 'astrop@buildtrack.co.zm', 'Project Manager', 'Olympia Park', '2020-07-01'),
(2, 'Joseph Mulenga', '0964783030', 'josephm@buildtrack.co.zm', 'Accounts Officer', 'Munali', '2020-07-21'),
(3, 'Sherine Chirwa', '0775651132', 'sherinec@buildtrack.co.zm', 'Procurement Officer', 'Chalala', '2020-08-01'),
(4, 'James Hamasenya', '0957800981', 'Jamesh@buildtrack.co.zm', 'Quantity Surveyor', 'Chamba Valley', '2020-08-27'),
(5, 'Tissa Kunda', '0778116760', 'tissak@buildtrack.co.zm', 'Project Manager', 'Makeni Villa', '2021-03-01'),
(6, 'Olivia Malambo', '0963336753', 'oliviam@buildtrack.co.zm', 'Quantity Surveyor', 'Chilanga', '2021-08-25'),
(7, 'Chibwe Mumba', '0966787898', 'chibwem@buildtrack.co.zm', 'Procurement Officer', 'Libala', '2021-10-01'),
(8, 'Dalitso Banda', '0978677432', 'dalitsob@buildtrack.co.zm', 'Project Manager', 'Kabwata', '2021-12-03'),
(9, 'Mercy Mtonga', '0956785566', 'mercym@buildtrack.co.zm', 'Help Desk', 'Roma Park', '2022-01-01'),
(10, 'Prince lubinda', '0959871122', 'princel@buildtrack.co.zm', 'Accounts Officer', 'Northmead', '2022-04-15');


INSERT INTO Projects(Project_ID, Client_ID, Contractor_ID, Project_Manager_ID, Project_Name, Project_Description, Start_Date, Expected_End_Date, Actual_End_Date, Project_Status, Project_Budget)
VALUES
(1,1,2,1, 'Chongwe Apartments', 'Construction of Apartment Units', '2024-05-10', '2024-10-20','2024-11-08', 'Completed', '2500000'),
(2,2,3,5, 'Astro Housing Unit', 'Construction of Housing Units', '2024-05-25', '2024-12-10', '2025-02-05', 'Completed', '4500000'),
(3,3,10,8, 'Zambezi Storage Facility', ' Construction of Agricultural Storage Facility', '2024-07-12', '2025-01-03', '2025-02-10', 'Completed', '1300000'),
(4,4,8,1, 'Lusaka Housing Properties', 'Rehabilitation of Lusaka Housing Properties', '2024-12-29', '2025-03-21', '2025-04-18', 'Completed', '800000'),
(5,5,7,5, 'Arcades Offices', 'Maintenance of Arcades Offices', '2025-03-01', '2025-04-26', '2025-05-01','Completed', '750000'),
(6,6,9,8, 'Kabwe School Block', 'Construction of a New Classroom Block', '2025-05-01', '2025-09-12', '2025-09-30', 'Completed', '2000000'),
(7,7,4,8, 'New Mpongwe Council Building', 'Construction of Mpongwe Council Building', '2026-01-09', '2026-11-25', NULL, 'Active', '5000000'),
(8,8,1,5, 'Zambia Sugar Facility', 'Construction of New Zambia Sugar Facility', '2026-02-04', '2027-02-04', NULL, 'Active', '9000000'),
(9,9,5,1, 'School of Business Campus', 'Construction of a School of Business Campus', '2026-12-09', '2028-12-10', NULL, 'Planned', '17000000'),
(10,10,6,5, 'National Assembly Library', 'Rehabilitation of National Assembly Library', '2027-01-01', '2028-05-01', NULL, 'Planned', '350000');

INSERT INTO Suppliers(Supplier_ID, Supplier_Name, Phone_Number, Email, Address)
VALUES
(1,'Lafarge Zambia', '0978757587', 'sales@lafarge.co.zm', 'Chilanga'),
(2, 'Afri Blocks Ltd', '0967546578', 'sales@afriblocks.co.zm', 'Lusaka'),
(3, 'Zed Paint Ltd', '0578909098', 'sales@zedpaintl.com', 'Ndola'),
(4, 'BuildChem Ltd', '0777664454', 'sales@buildchem.co.zm', 'Lusaka'),
(5, 'Sand Doctors', '0964443331', 'sales@safetyfc.com', 'Kabwe'),
(6, 'A & A Electricals', '0979001177', 'sales@aaelectricals.com', 'Kafue'),
(7, 'Zed Furnitures Ltd', '0567009878', 'sales@zedfurnitures.co.zm', 'Lusaka'),
(8, 'Aluminium and Steel Zambia', '0764433212', 'sales@alusteel.com', 'Livingstone'),
(9, 'Plumb Zed Ltd', '0775636671', 'sales@plumbzed.co.zm', 'Chipata'),
(10, 'Timber Zambia', '0956333121', 'sales@timber.com', 'Kapiri Mposhi');


INSERT INTO Materials(Material_ID, Material_Name, Unit, Unit_Price, Stock_Quantity, Reorder_Level)
VALUES
(1, 'River Sand', 'Tonne', '550', '150', '25'),
(2, 'Building Blocks', 'Piece', '8.50', '5000', '1000'),
(3, 'Cement', '50KG Bag', '125', '500', '100'),
(4, 'Chemicals', '20L Bucket', '650', '120', '25'),
(5, 'Timber', 'Piece', '95', '400', '80'),
(6, 'Interior Paint', '20L Bucket', '950', '100', '20'),
(7, 'Roofing Sheet', 'Piece', '180', '300', '60'),
(8, 'PVC Pipe', 'Length', '75', '500', '100'),
(9, 'Furniture', 'Piece', '1500', '300', '30'),
(10, 'Electrical Cable', 'Roll', '750', '100', '20');

INSERT INTO Purchase_Orders (Purchase_Order_ID, Project_ID, Supplier_ID, Order_Date, Expected_Delivery_Date, Status, Total_Amount)
VALUES
(1,1,1, '2024-04-10', '2024-05-03', 'Delivered','75000'),
(2,2,10, '2025-03-01', '2025-05-10', 'Delivered','56000'),
(3,3,4, '2024-06-01', '2024-06-30', 'Delivered', '27000'),
(4,4,5, '2024-10-01', '2024-11-26', 'Delivered', '35000'),
(5,5,7, '2025-02-05', '2025-02-26', 'Delivered', '150000'),
(6,6,3, '2025-07-10', '2025-08-30', 'Delivered', '45000'),
(7,7,8, '2026-07-30', '2026-10-26', 'Approved', '95000'),
(8,8,9, '2026-09-19', '2026-11-19', 'Approved', '82000'),
(9,9,2, '2026-10-30', '2027-01-25', 'Draft', '100000'),
(10,10,6, '2026-11-01', '2027-06-01', 'Draft', '130000');

INSERT INTO Purchase_Order_Items (Purchase_Order_Item, Purchase_Order_ID, Material_ID, Quantity, Unit_Price)
VALUES
(1,1,3, '500', '125'), (2,2, 5, '400', '95'), (3,3,4, '120', '650'), (4,4,1, '150', '550'),
(5,5,9, '300', '1500'), (6,6,6, '100', '950'), (7,7,7, '300', '180'), (8,8,8, '500', '75'),
(9,9,2, '5000', '8.50'), (10,10, 10, '100', '750');


INSERT INTO Deliveries(Delivery_ID, Purchase_Order_ID, Delivery_Date, Delivery_Reference, Received_By, Status, Notes)
VALUES
(1,1, '2024-05-03', 'DEL-001',3, 'Received', 'Cement delivered'), (2,2, '2025-05-10','DEL-002',3, 'Received', 'Timber delivered'),
(3,3, '2024-06-30', 'DEL-003',7, 'Received', 'Chemicals delivered'),(4,4, '2024-11-26', 'DEL-004',7, 'Received', 'River Sand Delivered'),
(5,5, '2025-02-26', 'DEL-005',3, 'Received', 'Furniture Delivered'),(6,6, '2025-08-30', 'DEL-006',3, 'Received', 'Interior Paint Delivered');

INSERT INTO Equipments(Equipment_ID, Equipment_Name, Equipment_Type, Registration_Number, Availability_Status)
VALUES
(1,'CAT Generator','Generator','GEN-001','Available'),
(2,'Honda Concrete Mixer','Concrete Mixer','MIX-001','Available'),
(3,'Toyota Hilux','Vehicle','VH-001','Allocated'),
(4,'Caterpillar Excavator','Excavator','EXC-001','Allocated'),
(5,'JCB Backhoe Loader','Backhoe','JCB-001','Available'),
(6,'Scaffolding Set A','Scaffolding','SCA-001','Allocated'),
(7,'Mobile Crane','Crane','CRN-001','Available'),
(8,'Plate Compactor','Compactor','CMP-001','Maintenance'),
(9,'Water Bowser','Vehicle','WTR-001','Allocated'),
(10,'Site Office Container','Site Facility','SOC-001','Available');

INSERT INTO Equipment_Allocations(Allocation_ID, Equipment_ID, Project_ID, Allocation_Start_Date, Allocation_End_Date, Purpose, Status)
VALUES
(1,3,1,'2024-05-10','2024-10-20','Transporting materials to site','Completed'),
(2,4,2,'2024-05-25','2024-12-10','Excavation work for foundation','Completed'),
(3,6,3,'2024-07-12','2025-01-03','Scaffolding for construction work','Completed'),
(4,9,4,'2024-12-29','2025-03-21','Water supply for construction site','Completed'),
(5,1,5,'2025-03-01','2025-04-26','Power supply for construction site','Completed'),
(6,2,6,'2025-05-01','2025-09-12','Mixing concrete for construction work','Completed'),
(7,5,7,'2026-01-09',NULL,'Backhoe work for excavation and landscaping','Active'),
(8,7,8,'2026-02-04',NULL,'Lifting heavy materials and equipment on site','Active');

INSERT INTO Project_Expenses(Expense_ID, Project_ID, Expense_Date, Expense_Category, Description, Amount)
VALUES
(1,1,'2024-05-15','Materials','Purchase of cement and sand','75000'),
(2,2,'2025-03-10','Labour','Payment for construction workers','56000'),
(3,3,'2024-07-20','Transport','Transportation of materials to site','27000'),
(4,4,'2024-11-01','Equipment','Rental of excavator for foundation work','35000'),
(5,5,'2025-02-15','Materials','Purchase of furniture for offices','150000'),
(6,6,'2025-08-05','Labour','Payment for construction workers','45000');

INSERT INTO Payments(Payment_ID, Supplier_ID, Purchase_Order_ID, Payment_Date, Amount, Payment_Method, Reference_Number)
VALUES
(1,1,1,'2024-05-05','75000','Bank Transfer','PAY-001'),
(2,10,2,'2025-05-12','56000','Cash','PAY-002'),
(3,4,3,'2024-07-01','27000','Mobile Money','PAY-003'),
(4,5,4,'2024-11-05','35000','Cheque','PAY-004'),
(5,7,5,'2025-02-28','150000','Bank Transfer','PAY-005'),
(6,3,6,'2025-09-01','45000','Cash','PAY-006');

SELECT * FROM vw_supplier_activity;
SELECT * FROM vw_project_expenditure;
SELECT * FROM vw_equipment_currently_assigned;