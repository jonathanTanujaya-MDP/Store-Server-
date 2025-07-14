--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: posgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO posgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: products; Type: TABLE; Schema: public; Owner: posgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(255),
    purchase_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    minimum_stock integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO posgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: posgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO posgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: posgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: restock_items; Type: TABLE; Schema: public; Owner: posgres
--

CREATE TABLE public.restock_items (
    restock_item_id integer NOT NULL,
    restock_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.restock_items OWNER TO posgres;

--
-- Name: restock_items_restock_item_id_seq; Type: SEQUENCE; Schema: public; Owner: posgres
--

CREATE SEQUENCE public.restock_items_restock_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restock_items_restock_item_id_seq OWNER TO posgres;

--
-- Name: restock_items_restock_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: posgres
--

ALTER SEQUENCE public.restock_items_restock_item_id_seq OWNED BY public.restock_items.restock_item_id;


--
-- Name: restock_transactions; Type: TABLE; Schema: public; Owner: posgres
--

CREATE TABLE public.restock_transactions (
    restock_id integer NOT NULL,
    supplier_name character varying(255),
    total_cost numeric(10,2) DEFAULT 0 NOT NULL,
    restock_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    invoice_number character varying(100),
    notes text
);


ALTER TABLE public.restock_transactions OWNER TO posgres;

--
-- Name: restock_transactions_restock_id_seq; Type: SEQUENCE; Schema: public; Owner: posgres
--

CREATE SEQUENCE public.restock_transactions_restock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restock_transactions_restock_id_seq OWNER TO posgres;

--
-- Name: restock_transactions_restock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: posgres
--

ALTER SEQUENCE public.restock_transactions_restock_id_seq OWNED BY public.restock_transactions.restock_id;


--
-- Name: sales_items; Type: TABLE; Schema: public; Owner: posgres
--

CREATE TABLE public.sales_items (
    sales_item_id integer NOT NULL,
    sales_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    purchase_price_at_sale numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    item_profit numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sales_items OWNER TO posgres;

--
-- Name: sales_items_sales_item_id_seq; Type: SEQUENCE; Schema: public; Owner: posgres
--

CREATE SEQUENCE public.sales_items_sales_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_items_sales_item_id_seq OWNER TO posgres;

--
-- Name: sales_items_sales_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: posgres
--

ALTER SEQUENCE public.sales_items_sales_item_id_seq OWNED BY public.sales_items.sales_item_id;


--
-- Name: sales_transactions; Type: TABLE; Schema: public; Owner: posgres
--

CREATE TABLE public.sales_transactions (
    sales_id integer NOT NULL,
    customer_name character varying(255) NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_profit numeric(10,2) DEFAULT 0 NOT NULL,
    payment_method character varying(50) DEFAULT 'cash'::character varying,
    transaction_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.sales_transactions OWNER TO posgres;

--
-- Name: sales_transactions_sales_id_seq; Type: SEQUENCE; Schema: public; Owner: posgres
--

CREATE SEQUENCE public.sales_transactions_sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_transactions_sales_id_seq OWNER TO posgres;

--
-- Name: sales_transactions_sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: posgres
--

ALTER SEQUENCE public.sales_transactions_sales_id_seq OWNED BY public.sales_transactions.sales_id;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: posgres
--

CREATE TABLE public.stock_movements (
    movement_id integer NOT NULL,
    product_id integer,
    movement_type character varying(20) NOT NULL,
    quantity_change integer NOT NULL,
    previous_stock integer NOT NULL,
    new_stock integer NOT NULL,
    reference_type character varying(20),
    reference_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.stock_movements OWNER TO posgres;

--
-- Name: stock_movements_movement_id_seq; Type: SEQUENCE; Schema: public; Owner: posgres
--

CREATE SEQUENCE public.stock_movements_movement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_movement_id_seq OWNER TO posgres;

--
-- Name: stock_movements_movement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: posgres
--

ALTER SEQUENCE public.stock_movements_movement_id_seq OWNED BY public.stock_movements.movement_id;


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: restock_items restock_item_id; Type: DEFAULT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.restock_items ALTER COLUMN restock_item_id SET DEFAULT nextval('public.restock_items_restock_item_id_seq'::regclass);


--
-- Name: restock_transactions restock_id; Type: DEFAULT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.restock_transactions ALTER COLUMN restock_id SET DEFAULT nextval('public.restock_transactions_restock_id_seq'::regclass);


--
-- Name: sales_items sales_item_id; Type: DEFAULT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.sales_items ALTER COLUMN sales_item_id SET DEFAULT nextval('public.sales_items_sales_item_id_seq'::regclass);


--
-- Name: sales_transactions sales_id; Type: DEFAULT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.sales_transactions ALTER COLUMN sales_id SET DEFAULT nextval('public.sales_transactions_sales_id_seq'::regclass);


--
-- Name: stock_movements movement_id; Type: DEFAULT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN movement_id SET DEFAULT nextval('public.stock_movements_movement_id_seq'::regclass);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: posgres
--

COPY public.products (id, name, category, purchase_price, selling_price, stock_quantity, minimum_stock, created_at, updated_at) FROM stdin;
1	Laptop Dell Inspiron	Electronics	8000000.00	10000000.00	10	5	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
2	Mouse Wireless Logitech	Electronics	150000.00	200000.00	25	10	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
3	Keyboard Gaming Mechanical	Electronics	750000.00	1000000.00	15	8	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
4	Monitor 24 inch Samsung	Electronics	2500000.00	3200000.00	8	3	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
6	Smartphone Samsung A54	Electronics	4500000.00	5500000.00	12	5	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
7	Tablet iPad Air	Electronics	7000000.00	8500000.00	6	3	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
9	Power Bank 20000mAh	Electronics	250000.00	350000.00	30	15	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
10	Webcam Logitech HD	Electronics	800000.00	1200000.00	18	8	2025-07-12 12:25:24.539927+07	2025-07-12 12:25:24.539927+07
11	Laptop Dell Inspiron	Electronics	8000000.00	10000000.00	10	5	2025-07-12 12:30:26.707934+07	2025-07-12 12:30:26.707934+07
12	Mouse Wireless Logitech	Electronics	150000.00	200000.00	25	10	2025-07-12 12:30:26.707934+07	2025-07-12 12:30:26.707934+07
13	Keyboard Gaming Mechanical	Electronics	750000.00	1000000.00	15	8	2025-07-12 12:30:26.707934+07	2025-07-12 12:30:26.707934+07
14	Monitor 24 inch Samsung	Electronics	2500000.00	3200000.00	8	3	2025-07-12 12:30:26.707934+07	2025-07-12 12:30:26.707934+07
15	Headphone Gaming Razer	Electronics	500000.00	750000.00	20	10	2025-07-12 12:30:26.707934+07	2025-07-12 12:30:26.707934+07
19	Power Bank 20000mAh	Electronics	250000.00	350000.00	30	15	2025-07-12 12:30:26.707934+07	2025-07-12 12:30:26.707934+07
8	Smartwatch Apple Watch	Electronics	4000000.00	5000000.00	9	4	2025-07-12 12:25:24.539927+07	2025-07-12 12:30:58.533052+07
16	Smartphone Samsung A54	Electronics	4500000.00	5500000.00	8	5	2025-07-12 12:30:26.707934+07	2025-07-12 12:38:05.251624+07
17	Tablet iPad Air	Electronics	7000000.00	8500000.00	5	3	2025-07-12 12:30:26.707934+07	2025-07-12 12:38:32.625742+07
5	Headphone Gaming Razer	Electronics	500000.00	750000.00	3	10	2025-07-12 12:25:24.539927+07	2025-07-12 12:54:33.041323+07
18	Smartwatch Apple Watch	Electronics	4000000.00	5000000.00	4	4	2025-07-12 12:30:26.707934+07	2025-07-13 13:59:55.814176+07
20	Webcam Logitech HD	Electronics	800000.00	1200000.00	11	8	2025-07-12 12:30:26.707934+07	2025-07-13 14:03:09.354239+07
\.


--
-- Data for Name: restock_items; Type: TABLE DATA; Schema: public; Owner: posgres
--

COPY public.restock_items (restock_item_id, restock_id, product_id, quantity, unit_cost, subtotal, created_at) FROM stdin;
4	4	8	1	4000000.00	4000000.00	2025-07-12 12:30:58.533052+07
5	5	20	5	800000.00	4000000.00	2025-07-12 12:36:57.760872+07
6	6	20	1	800000.00	800000.00	2025-07-12 12:38:24.101537+07
7	7	20	5	800000.00	4000000.00	2025-07-12 12:47:23.417496+07
8	8	20	5	800000.00	4000000.00	2025-07-13 14:03:09.342778+07
\.


--
-- Data for Name: restock_transactions; Type: TABLE DATA; Schema: public; Owner: posgres
--

COPY public.restock_transactions (restock_id, supplier_name, total_cost, restock_date, invoice_number, notes) FROM stdin;
4	ssd	4000000.00	2025-07-12 12:30:58.533052+07	\N	\N
5	Test Supplier	4000000.00	2025-07-12 12:36:57.760872+07	\N	\N
6	wd	800000.00	2025-07-12 12:38:24.101537+07	\N	\N
7	Test Supplier	4000000.00	2025-07-12 12:47:23.417496+07	\N	\N
8	Test Supplier	4000000.00	2025-07-13 14:03:09.342778+07	\N	\N
\.


--
-- Data for Name: sales_items; Type: TABLE DATA; Schema: public; Owner: posgres
--

COPY public.sales_items (sales_item_id, sales_id, product_id, quantity, unit_price, purchase_price_at_sale, subtotal, item_profit, created_at) FROM stdin;
1	5	18	1	5000000.00	4000000.00	5000000.00	1000000.00	2025-07-12 12:38:05.251624+07
2	5	16	4	5500000.00	4500000.00	22000000.00	4000000.00	2025-07-12 12:38:05.251624+07
3	6	17	1	8500000.00	7000000.00	8500000.00	1500000.00	2025-07-12 12:38:32.625742+07
4	7	20	2	1200000.00	800000.00	2400000.00	800000.00	2025-07-12 12:47:23.429087+07
5	8	20	1	1200000.00	800000.00	1200000.00	400000.00	2025-07-12 12:54:33.041323+07
6	8	5	17	750000.00	500000.00	12750000.00	4250000.00	2025-07-12 12:54:33.041323+07
7	8	20	17	1200000.00	800000.00	20400000.00	6800000.00	2025-07-12 12:54:33.041323+07
8	9	18	3	5000000.00	4000000.00	15000000.00	3000000.00	2025-07-13 13:59:55.814176+07
9	9	20	1	1200000.00	800000.00	1200000.00	400000.00	2025-07-13 13:59:55.814176+07
10	10	20	2	1200000.00	800000.00	2400000.00	800000.00	2025-07-13 14:03:09.354239+07
\.


--
-- Data for Name: sales_transactions; Type: TABLE DATA; Schema: public; Owner: posgres
--

COPY public.sales_transactions (sales_id, customer_name, total_amount, total_profit, payment_method, transaction_date, notes) FROM stdin;
5	dsssd	27000000.00	5000000.00	cash	2025-07-12 12:38:05.251624+07	\N
6	sd	8500000.00	1500000.00	cash	2025-07-12 12:38:32.625742+07	\N
7	Test Customer	2400000.00	800000.00	cash	2025-07-12 12:47:23.429087+07	\N
8	dada	34350000.00	11450000.00	cash	2025-07-12 12:54:33.041323+07	\N
9	fs	16200000.00	3400000.00	cash	2025-07-13 13:59:55.814176+07	\N
10	Test Customer	2400000.00	800000.00	cash	2025-07-13 14:03:09.354239+07	\N
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: posgres
--

COPY public.stock_movements (movement_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reference_type, reference_id, created_at, notes) FROM stdin;
1	8	RESTOCK	1	8	9	RESTOCK	4	2025-07-12 12:30:58.533052+07	\N
2	20	RESTOCK	5	18	23	RESTOCK	5	2025-07-12 12:36:57.760872+07	\N
3	18	SALE	-1	8	7	SALE	5	2025-07-12 12:38:05.251624+07	\N
4	16	SALE	-4	12	8	SALE	5	2025-07-12 12:38:05.251624+07	\N
5	20	RESTOCK	1	23	24	RESTOCK	6	2025-07-12 12:38:24.101537+07	\N
6	17	SALE	-1	6	5	SALE	6	2025-07-12 12:38:32.625742+07	\N
7	20	RESTOCK	5	24	29	RESTOCK	7	2025-07-12 12:47:23.417496+07	\N
8	20	SALE	-2	29	27	SALE	7	2025-07-12 12:47:23.429087+07	\N
9	20	SALE	-1	27	26	SALE	8	2025-07-12 12:54:33.041323+07	\N
10	5	SALE	-17	20	3	SALE	8	2025-07-12 12:54:33.041323+07	\N
11	20	SALE	-17	26	9	SALE	8	2025-07-12 12:54:33.041323+07	\N
12	18	SALE	-3	7	4	SALE	9	2025-07-13 13:59:55.814176+07	\N
13	20	SALE	-1	9	8	SALE	9	2025-07-13 13:59:55.814176+07	\N
14	20	RESTOCK	5	8	13	RESTOCK	8	2025-07-13 14:03:09.342778+07	\N
15	20	SALE	-2	13	11	SALE	10	2025-07-13 14:03:09.354239+07	\N
\.


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: posgres
--

SELECT pg_catalog.setval('public.products_id_seq', 20, true);


--
-- Name: restock_items_restock_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: posgres
--

SELECT pg_catalog.setval('public.restock_items_restock_item_id_seq', 8, true);


--
-- Name: restock_transactions_restock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: posgres
--

SELECT pg_catalog.setval('public.restock_transactions_restock_id_seq', 8, true);


--
-- Name: sales_items_sales_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: posgres
--

SELECT pg_catalog.setval('public.sales_items_sales_item_id_seq', 10, true);


--
-- Name: sales_transactions_sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: posgres
--

SELECT pg_catalog.setval('public.sales_transactions_sales_id_seq', 10, true);


--
-- Name: stock_movements_movement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: posgres
--

SELECT pg_catalog.setval('public.stock_movements_movement_id_seq', 15, true);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: restock_items restock_items_pkey; Type: CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.restock_items
    ADD CONSTRAINT restock_items_pkey PRIMARY KEY (restock_item_id);


--
-- Name: restock_transactions restock_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.restock_transactions
    ADD CONSTRAINT restock_transactions_pkey PRIMARY KEY (restock_id);


--
-- Name: sales_items sales_items_pkey; Type: CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_pkey PRIMARY KEY (sales_item_id);


--
-- Name: sales_transactions sales_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (sales_id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (movement_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: posgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: posgres
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- Name: idx_restock_date; Type: INDEX; Schema: public; Owner: posgres
--

CREATE INDEX idx_restock_date ON public.restock_transactions USING btree (restock_date);


--
-- Name: idx_sales_date; Type: INDEX; Schema: public; Owner: posgres
--

CREATE INDEX idx_sales_date ON public.sales_transactions USING btree (transaction_date);


--
-- Name: idx_stock_movements_date; Type: INDEX; Schema: public; Owner: posgres
--

CREATE INDEX idx_stock_movements_date ON public.stock_movements USING btree (created_at);


--
-- Name: idx_stock_movements_product; Type: INDEX; Schema: public; Owner: posgres
--

CREATE INDEX idx_stock_movements_product ON public.stock_movements USING btree (product_id);


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: posgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: restock_items restock_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.restock_items
    ADD CONSTRAINT restock_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: restock_items restock_items_restock_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.restock_items
    ADD CONSTRAINT restock_items_restock_id_fkey FOREIGN KEY (restock_id) REFERENCES public.restock_transactions(restock_id) ON DELETE CASCADE;


--
-- Name: sales_items sales_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: sales_items sales_items_sales_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_sales_id_fkey FOREIGN KEY (sales_id) REFERENCES public.sales_transactions(sales_id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: posgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO posgres;


--
-- PostgreSQL database dump complete
--

