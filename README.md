Gits Commands
echo "# FYP_EcoScout_Code" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/AbdullahNaveeed/FYP_EcoScout_Code.git
git push -u origin main
git push -u origin main

How to run the frontend
How I create the frontend 
(npx create-react-app .
npm install axios lucide-react clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p)

npm install
npm start

How to run the backend
python -m venv venv
.\venv\Scripts\activate
pip install ultralytics easyocr fastapi uvicorn opencv-python-headless python-multipart

uvicorn main:app --reload
