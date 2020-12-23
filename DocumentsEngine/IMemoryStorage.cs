using System;
using System.Collections.Generic;
using System.Text;

namespace DocumentsEngine
{
    interface IMemoryStorage
    {
        public void SaveDocument(Document document);
        public Document GetDocument(int id);
        public void UpdateDocument(Document doc);
        public List<Document> GetAllDocuments();
        public bool DeleteDocument(int id);
        public List<int> GetAllDocumentsIds();
        public void UpdateDocumentAmount(int docId, decimal newAmount);
        public void DocumentAmountDiscount(int docId, decimal discountAmount, int updateThreshold);
    }
}
