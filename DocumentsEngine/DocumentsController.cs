using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DocumentsEngine;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace QuickStart.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {

        private readonly IDocumentsService _ds;

        public DocumentsController(IDocumentsService ds)
        {
            _ds = ds;
        }


        [HttpGet]
        public IEnumerable<Document> Get()
        {
            Document doc = new Document()
            {
                Title = "T1",
                TotalAmount = 20,
            };
            
            
            _ds.add(doc);
            var list = _ds.listDocuments();
            return list;
        }

        [HttpGet("{id}")]
        public ActionResult<Document> Get(int id)
        {
            return _ds.get(id);
        }

        [HttpDelete("{id}")]
        public ActionResult<bool> Delete(int id)
        {
            return _ds.delete(id);
        }

        [HttpPost]
        public void Post([FromBody] Document doc)
        {
            _ds.add(doc);
        }

        [HttpPut("{id}")]
        public void Put(int id, [FromBody] Document doc)
        {
            _ds.update(doc);
        }

    }
}
