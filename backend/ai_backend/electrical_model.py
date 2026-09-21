import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

import joblib


ms = pd.read_csv('electrical_data.csv')

x = ms['question']
y = ms['answer']


x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.2, random_state=42
)


vectorizer = TfidfVectorizer()

x_train = vectorizer.fit_transform(x_train)
x_test = vectorizer.transform(x_test)


model = DecisionTreeClassifier()

model.fit(x_train, y_train)


predictions = model.predict(x_test)

accuracy = accuracy_score(y_test, predictions)

print("Accuracy:", accuracy)
print("Predictions:", predictions)


joblib.dump(model, 'electrical_model.joblib')
joblib.dump(vectorizer, 'electrical_vectorizer.joblib')