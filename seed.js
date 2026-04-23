require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

const data = [
  { name: 'Agriculture', icon: '🌱', type: 'business', subCategories: [
    { name: 'Agricultural & Gardening Tool', icon: '🌿' },
    { name: 'Agricultural Pesticides', icon: '🧑‍🌾' },
    { name: 'Agriculture Machinery', icon: '🚜' },
    { name: 'Animal Feed', icon: '🌾' },
    { name: 'Fertilizer', icon: '🪣' },
    { name: 'Seeds & Saplings', icon: '🌱' },
  ]},
  { name: 'App And Web Development', icon: '💻', type: 'business', subCategories: [
    { name: 'Android App Development', icon: '📱' },
    { name: 'iOS App Development', icon: '🍎' },
    { name: 'Web Design', icon: '🎨' },
    { name: 'Web Development', icon: '💻' },
    { name: 'E-Commerce Development', icon: '🛒' },
    { name: 'SEO Services', icon: '🔍' },
  ]},
  { name: 'Automobile', icon: '🚗', type: 'business', subCategories: [
    { name: 'Car Dealer', icon: '🚗' },
    { name: 'Bike Dealer', icon: '🏍️' },
    { name: 'Auto Repair', icon: '🔧' },
    { name: 'Car Wash', icon: '🚿' },
    { name: 'Tyre Shop', icon: '🔄' },
    { name: 'Spare Parts', icon: '⚙️' },
  ]},
  { name: 'Cafe', icon: '☕', type: 'business', subCategories: [
    { name: 'Coffee Shop', icon: '☕' },
    { name: 'Tea Stall', icon: '🍵' },
    { name: 'Bakery Cafe', icon: '🥐' },
    { name: 'Juice Bar', icon: '🥤' },
    { name: 'Ice Cream Parlour', icon: '🍦' },
  ]},
  { name: 'Chemist', icon: '💊', type: 'business', subCategories: [
    { name: 'Medical Store', icon: '💊' },
    { name: 'Ayurvedic Store', icon: '🌿' },
    { name: 'Homeopathy', icon: '🧴' },
    { name: 'Surgical Items', icon: '🩺' },
  ]},
  { name: 'Computer & It', icon: '💻', type: 'business', subCategories: [
    { name: 'Computer Sales', icon: '🖥️' },
    { name: 'Laptop Repair', icon: '💻' },
    { name: 'Networking', icon: '🌐' },
    { name: 'CCTV Installation', icon: '📷' },
    { name: 'Software Solutions', icon: '💾' },
  ]},
  { name: 'Doctor', icon: '👨‍⚕️', type: 'business', subCategories: [
    { name: 'General Physician', icon: '👨‍⚕️' },
    { name: 'Dentist', icon: '🦷' },
    { name: 'Eye Specialist', icon: '👁️' },
    { name: 'Skin Specialist', icon: '🩺' },
    { name: 'Orthopedic', icon: '🦴' },
    { name: 'Gynecologist', icon: '👩‍⚕️' },
    { name: 'Pediatrician', icon: '👶' },
    { name: 'Cardiologist', icon: '❤️' },
  ]},
  { name: 'Education', icon: '📖', type: 'business', subCategories: [
    { name: 'School', icon: '🏫' },
    { name: 'College', icon: '🎓' },
    { name: 'Coaching Center', icon: '📖' },
    { name: 'Tuition', icon: '✏️' },
    { name: 'Online Classes', icon: '💻' },
    { name: 'Music Classes', icon: '🎵' },
    { name: 'Dance Classes', icon: '💃' },
  ]},
  { name: 'Electric & Electronics', icon: '⚡', type: 'business', subCategories: [
    { name: 'Electrical Shop', icon: '⚡' },
    { name: 'Electronics Store', icon: '📺' },
    { name: 'AC & Refrigerator', icon: '❄️' },
    { name: 'LED & Lighting', icon: '💡' },
    { name: 'Solar Products', icon: '☀️' },
  ]},
  { name: 'Event Organizer', icon: '📅', type: 'business', subCategories: [
    { name: 'Wedding Planner', icon: '💒' },
    { name: 'Birthday Party', icon: '🎂' },
    { name: 'Corporate Events', icon: '🏢' },
    { name: 'Concert & Shows', icon: '🎤' },
  ]},
  { name: 'Financial Consultant', icon: '💰', type: 'business', subCategories: [
    { name: 'Tax Consultant', icon: '📋' },
    { name: 'CA Services', icon: '💼' },
    { name: 'Investment Advisor', icon: '📈' },
    { name: 'Loan Consultant', icon: '💰' },
    { name: 'Accounting', icon: '🧾' },
  ]},
  { name: 'Fitness & Gym', icon: '🏋️', type: 'business', subCategories: [
    { name: 'Gym', icon: '🏋️' },
    { name: 'Yoga Center', icon: '🧘' },
    { name: 'Zumba Classes', icon: '💃' },
    { name: 'Martial Arts', icon: '🥋' },
    { name: 'Swimming Pool', icon: '🏊' },
  ]},
  { name: 'Furniture', icon: '🛋️', type: 'business', subCategories: [
    { name: 'Home Furniture', icon: '🛋️' },
    { name: 'Office Furniture', icon: '🪑' },
    { name: 'Wooden Furniture', icon: '🪵' },
    { name: 'Kids Furniture', icon: '🧸' },
  ]},
  { name: 'Garments', icon: '👕', type: 'business', subCategories: [
    { name: 'Men Clothing', icon: '👔' },
    { name: 'Women Clothing', icon: '👗' },
    { name: 'Kids Clothing', icon: '👶' },
    { name: 'Ethnic Wear', icon: '🥻' },
    { name: 'Winter Wear', icon: '🧥' },
  ]},
  { name: 'Grocery And General Store', icon: '🛒', type: 'business', subCategories: [
    { name: 'Grocery Store', icon: '🛒' },
    { name: 'Supermarket', icon: '🏬' },
    { name: 'Organic Store', icon: '🌿' },
    { name: 'Dry Fruits', icon: '🥜' },
    { name: 'Dairy Products', icon: '🥛' },
  ]},
  { name: 'Health & Beauty', icon: '💅', type: 'business', subCategories: [
    { name: 'Beauty Parlour', icon: '💅' },
    { name: 'Salon', icon: '💇' },
    { name: 'Spa', icon: '🧖' },
    { name: 'Makeup Artist', icon: '💄' },
    { name: 'Mehndi Artist', icon: '🌸' },
  ]},
  { name: 'Hospitals', icon: '🏥', type: 'business', subCategories: [
    { name: 'Multi Specialty Hospital', icon: '🏥' },
    { name: 'Clinic', icon: '🩺' },
    { name: 'Diagnostic Lab', icon: '🔬' },
    { name: 'Ambulance Service', icon: '🚑' },
    { name: 'Pharmacy', icon: '💊' },
  ]},
  { name: 'Hotel', icon: '🏨', type: 'business', subCategories: [
    { name: 'Budget Hotel', icon: '🏨' },
    { name: 'Luxury Hotel', icon: '🌟' },
    { name: 'Resort', icon: '🏖️' },
    { name: 'Guest House', icon: '🏡' },
    { name: 'Homestay', icon: '🏠' },
  ]},
  { name: 'Jewellery & Gemstones', icon: '💎', type: 'business', subCategories: [
    { name: 'Gold Jewellery', icon: '💛' },
    { name: 'Silver Jewellery', icon: '⚪' },
    { name: 'Diamond Jewellery', icon: '💎' },
    { name: 'Artificial Jewellery', icon: '📿' },
    { name: 'Watches', icon: '⌚' },
  ]},
  { name: 'Mobile', icon: '📱', type: 'business', subCategories: [
    { name: 'Mobile Phones', icon: '📱' },
    { name: 'Mobile Repair', icon: '🔧' },
    { name: 'Mobile Accessories', icon: '🎧' },
    { name: 'Second Hand Mobile', icon: '♻️' },
  ]},
  { name: 'Packers & Movers', icon: '📦', type: 'business', subCategories: [
    { name: 'Home Shifting', icon: '🏠' },
    { name: 'Office Shifting', icon: '🏢' },
    { name: 'Vehicle Transport', icon: '🚗' },
    { name: 'Warehouse Storage', icon: '🏭' },
  ]},
  { name: 'Pet & Pets Care', icon: '🐕', type: 'business', subCategories: [
    { name: 'Pet Shop', icon: '🐕' },
    { name: 'Veterinary Doctor', icon: '🩺' },
    { name: 'Pet Grooming', icon: '✂️' },
    { name: 'Pet Food', icon: '🦴' },
  ]},
  { name: 'Real Estate', icon: '🏢', type: 'business', subCategories: [
    { name: 'Residential Property', icon: '🏠' },
    { name: 'Commercial Property', icon: '🏢' },
    { name: 'Plot & Land', icon: '🗺️' },
    { name: 'Rental Property', icon: '🔑' },
    { name: 'Property Dealer', icon: '🤝' },
    { name: 'Interior Designer', icon: '🎨' },
  ]},
  { name: 'Rent & Hire', icon: '🤝', type: 'business', subCategories: [
    { name: 'Car On Rent', icon: '🚗' },
    { name: 'House On Rent', icon: '🏠' },
    { name: 'Furniture On Rent', icon: '🛋️' },
    { name: 'Equipment On Rent', icon: '🔧' },
  ]},
  { name: 'Repair & Services', icon: '🔧', type: 'business', subCategories: [
    { name: 'AC Repair', icon: '❄️' },
    { name: 'TV Repair', icon: '📺' },
    { name: 'Mobile Repair', icon: '📱' },
    { name: 'Washing Machine Repair', icon: '🫧' },
    { name: 'Refrigerator Repair', icon: '🧊' },
    { name: 'Laptop Repair', icon: '💻' },
  ]},
  { name: 'Restaurant And Dhaba', icon: '🍽️', type: 'business', subCategories: [
    { name: 'Veg Restaurant', icon: '🥗' },
    { name: 'Non-Veg Restaurant', icon: '🍗' },
    { name: 'Dhaba', icon: '🍛' },
    { name: 'Fast Food', icon: '🍔' },
    { name: 'Pizza & Pasta', icon: '🍕' },
    { name: 'Sweets & Snacks', icon: '🍬' },
  ]},
  { name: 'Salon & Spa', icon: '💇', type: 'business', subCategories: [
    { name: 'Hair Salon', icon: '💇' },
    { name: 'Unisex Salon', icon: '✂️' },
    { name: 'Spa & Massage', icon: '🧖' },
    { name: 'Nail Studio', icon: '💅' },
    { name: 'Bridal Makeup', icon: '👰' },
  ]},
  { name: 'Tour & Travel', icon: '✈️', type: 'business', subCategories: [
    { name: 'Travel Agency', icon: '✈️' },
    { name: 'Tour Packages', icon: '🗺️' },
    { name: 'Cab Service', icon: '🚕' },
    { name: 'Hotel Booking', icon: '🏨' },
    { name: 'Visa Services', icon: '🛂' },
    { name: 'Honeymoon Packages', icon: '💑' },
  ]},
  { name: 'Vegetables And Fruits', icon: '🥬', type: 'business', subCategories: [
    { name: 'Fresh Vegetables', icon: '🥦' },
    { name: 'Fresh Fruits', icon: '🍎' },
    { name: 'Organic Vegetables', icon: '🌿' },
    { name: 'Dry Fruits', icon: '🥜' },
  ]},
  { name: 'Wedding', icon: '💒', type: 'business', subCategories: [
    { name: 'Wedding Planner', icon: '💒' },
    { name: 'Wedding Venue', icon: '🏛️' },
    { name: 'Wedding Photographer', icon: '📷' },
    { name: 'Wedding Catering', icon: '🍽️' },
    { name: 'Bridal Wear', icon: '👰' },
    { name: 'DJ & Music', icon: '🎵' },
  ]},
  // Professional Services
  { name: 'Electrician', icon: '⚡', type: 'professional', subCategories: [
    { name: 'Home Wiring', icon: '🔌' },
    { name: 'Fan Installation', icon: '💨' },
    { name: 'AC Installation', icon: '❄️' },
    { name: 'Solar Installation', icon: '☀️' },
    { name: 'Inverter & Battery', icon: '🔋' },
  ]},
  { name: 'Plumber', icon: '🔧', type: 'professional', subCategories: [
    { name: 'Pipe Fitting', icon: '🔧' },
    { name: 'Tap & Faucet Repair', icon: '🚰' },
    { name: 'Bathroom Fitting', icon: '🚿' },
    { name: 'Water Tank Cleaning', icon: '💧' },
    { name: 'Leak Repair', icon: '💦' },
  ]},
  { name: 'Carpenter', icon: '🪚', type: 'professional', subCategories: [
    { name: 'Furniture Making', icon: '🛋️' },
    { name: 'Furniture Repair', icon: '🔧' },
    { name: 'Door & Window Fitting', icon: '🚪' },
    { name: 'Modular Kitchen', icon: '🍳' },
    { name: 'Wardrobe Making', icon: '🗄️' },
  ]},
  { name: 'Painter', icon: '🎨', type: 'professional', subCategories: [
    { name: 'Interior Painting', icon: '🎨' },
    { name: 'Exterior Painting', icon: '🏠' },
    { name: 'Texture Painting', icon: '✨' },
    { name: 'Wood Polish', icon: '🪵' },
  ]},
  { name: 'Beautician', icon: '💄', type: 'professional', subCategories: [
    { name: 'Facial & Cleanup', icon: '✨' },
    { name: 'Waxing', icon: '🌸' },
    { name: 'Bridal Makeup', icon: '👰' },
    { name: 'Hair Styling', icon: '💇' },
    { name: 'Mehndi', icon: '🌿' },
  ]},
  { name: 'Driver', icon: '🚗', type: 'professional', subCategories: [
    { name: 'Personal Driver', icon: '🚗' },
    { name: 'Cab Driver', icon: '🚕' },
    { name: 'Truck Driver', icon: '🚛' },
    { name: 'Outstation Driver', icon: '🛣️' },
  ]},
  { name: 'House Keeper', icon: '🧹', type: 'professional', subCategories: [
    { name: 'Daily Cleaning', icon: '🧹' },
    { name: 'Deep Cleaning', icon: '🫧' },
    { name: 'Kitchen Cleaning', icon: '🍳' },
    { name: 'Sofa & Carpet Cleaning', icon: '🛋️' },
    { name: 'Cook & Maid', icon: '👩‍🍳' },
  ]},
  { name: 'Photographer', icon: '📸', type: 'professional', subCategories: [
    { name: 'Wedding Photography', icon: '💒' },
    { name: 'Birthday Photography', icon: '🎂' },
    { name: 'Product Photography', icon: '📦' },
    { name: 'Videography', icon: '🎬' },
    { name: 'Drone Photography', icon: '🚁' },
  ]},
  { name: 'Tailor', icon: '👗', type: 'professional', subCategories: [
    { name: 'Ladies Stitching', icon: '👗' },
    { name: 'Gents Stitching', icon: '👔' },
    { name: 'Kids Stitching', icon: '👶' },
    { name: 'Alteration', icon: '✂️' },
    { name: 'Embroidery', icon: '🧵' },
  ]},
  { name: 'Chef', icon: '👨‍🍳', type: 'professional', subCategories: [
    { name: 'Home Cook', icon: '🍳' },
    { name: 'Party Cook', icon: '🎉' },
    { name: 'Tiffin Service', icon: '🍱' },
    { name: 'Baking & Pastry', icon: '🎂' },
  ]},
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await Category.deleteMany({});
    console.log('Old categories cleared');

    await Category.insertMany(data);
    console.log(`✅ ${data.length} categories seeded successfully!`);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
