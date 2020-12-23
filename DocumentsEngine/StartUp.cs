using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using DocumentsEngine;

public class Startup
{
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _config;

    public Startup(IHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _config = config;
    }

    public void ConfigureServices(IServiceCollection services)
    {

        services.AddSingleton<IMemoryStorage, MemoryStorage>();
        services.AddSingleton<IDocumentsService, DocumentsService>();
        services.AddControllers();
        
        /*
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "DocumentsEngine", Version = "v1" });
        });
        */
        
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseHttpsRedirection();
        app.UseRouting();
        //app.UseAuthorization();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }
}