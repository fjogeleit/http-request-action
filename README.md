# HTTP Request Action

**Create HTTP Requests from GitHub Actions.** This action allows GitHub events to engage with tools like Ansible AWX that use HTTP APIs.

## Example
```yaml
jobs:
  deployment:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy Stage
      uses: fjogeleit/http-request-action@v1
      with:
        url: 'https://ansible.io/api/v2/job_templates/84/launch/'
        method: 'POST'
        username: ${{ secrets.AWX_USER }}
        password: ${{ secrets.AWX_PASSWORD }}
        customHeaders: '{"Content-Type": "application/json"}'
        data: '{"key_1": "value_1", "key_2": "value_2"}'
```

## Versioning

`master` branch is deprecated. Please use `main` or `v1` to get the latest version of this action. It is recommended to use a fixed version.

## Request Configuration

| Argument                   | Description                                                                                                                                                                                                                                                                                                      | Default          |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|
| url                        | Request URL                                                                                                                                                                                                                                                                                                      | _required_ Field |
| method                     | Request Method                                                                                                                                                                                                                                                                                                   | POST             |
| contentType                | Request Content-Type                                                                                                                                                                                                                                                                                             | application/json |
| data                       | Request body content:<br>- Text content such as JSON or XML<br>- key=value pairs separated by `&`, or JSON data with `contentType: application/x-www-form-urlencoded`<br><br>Only for POST, PUT, and PATCH requests                                                                                              | '{}'             |
| files                      | Map of keys to absolute file paths, sent as a multipart/form-data request to the API. If set, `contentType` is set to `multipart/form-data`; values provided by `data` will be added as additional FormData values. Nested objects are not supported. **Example provided in the _test_ Workflow of this Action** | '{}'             |
| file                       | Single absolute file path sent as an `application/octet-stream` request to the API. If set, `contentType` is set to `application/octet-stream`. This input is ignored if either `data` or `files` is present. **Example provided in the _test_ Workflow of this Action**                                         |                  |
| timeout                    | Request Timeout in ms                                                                                                                                                                                                                                                                                            | 5000 (5s)        |
| username                   | Username for Basic Auth                                                                                                                                                                                                                                                                                          |                  |
| password                   | Password for Basic Auth                                                                                                                                                                                                                                                                                          |                  |
| bearerToken                | Bearer authentication token (without the `Bearer` prefix)                                                                                                                                                                                                                                                        |                  |
| customHeaders              | Additional header values as a JSON string. Keys in this object overwrite default headers such as `Content-Type`                                                                                                                                                                                                  | '{}'             |
| escapeData                 | Escape newlines in data string content. Use `true` (string) to enable                                                                                                                                                                                                                                            |                  |
| preventFailureOnNoResponse | Prevent this action from failing if the request responds without a response. Use `true` (string) to enable                                                                                                                                                                                                       |                  |
| ignoreStatusCodes          | Prevent this action from failing if the request responds with one of the configured status codes. Example: `404,401`                                                                                                                                                                                             |                  |
| httpsCA                    | Certificate authority as string in PEM format                                                                                                                                                                                                                                                                    |                  |
| httpsCert                  | Client Certificate as string                                                                                                                                                                                                                                                                                     |                  |
| httpsKey                   | Client Certificate Key as string                                                                                                                                                                                                                                                                                 |                  |
| responseFile               | Persist the response data to the specified file path                                                                                                                                                                                                                                                             |                  |
| maskResponse               | If set to `true`, the response will be masked in the action logs                                                                                                                                                                                                                                                 | 'false'          |
| retry                      | Optional number of retries if the request fails; does not retry if the status code is ignored                                                                                                                                                                                                                    |                  |
| retryWait                  | Time between each retry in milliseconds                                                                                                                                                                                                                                                                          | 3000             |
| ignoreSsl                  | Ignore SSL verification (`rejectUnauthorized: false`)                                                                                                                                                                                                                                                            | false            |

## Response

| Variable       | Description                                                                                                           |
|----------------|-----------------------------------------------------------------------------------------------------------------------|
| `response`     | Response body as a JSON string                                                                                        |
| `headers`      | HTTP response headers as an object                                                                                    |
| `status`       | HTTP status code (e.g. `200`, `404`)                                                                                  |
| `requestError` | Set on request failure (Axios error). JSON string with fields `name`, `message`, `code`, and `status` (may be `null`) |

To display HTTP response data in the GitHub Actions log give the request an `id` and access its `outputs`. You can also access specific field from the response data using [fromJson()](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#fromjson) expression.

```yaml
steps:
  - name: Make Request
    id: myRequest
    uses: fjogeleit/http-request-action@v1
    with:
      url: "http://yoursite.com/api"
  - name: Show Response
    run: |
      echo ${{ steps.myRequest.outputs.response }}
      echo ${{ steps.myRequest.outputs.headers }}
      echo ${{ steps.myRequest.outputs.status }}
      echo ${{ fromJson(steps.myRequest.outputs.response).field_you_want_to_access }}
```

## Additional Information

Additional information is available if debug logging is enabled:
- Instance Configuration (Url / Timeout / Headers)
- Request Data (Body / Auth / Method)

To [enable debug logging in GitHub Actions](https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging), create a secret `ACTIONS_RUNNER_DEBUG` with a value of `true`.

### Local Usage

* You can execute this tool locally with the provided CLI `bin/http-action`.

```bash
bin/http-action --help
Positionals:
  url  request URL                                                     [string]

Options:
      --help           show help                                       [boolean]
  -d, --data           request body data                               [string] [default: "{}"]
  -f, --files          request files, send as multipart/form-data      [string] [default: "{}"]
      --file           single file, send as application/octet-stream   [string]
  -h, --customHeaders  custom request headers                          [string] [default: "{}"]
  -m, --method         request method (GET, POST, PATCH, PUT, DELETE)  [string] [default: "POST"]
  -t, --contentType    request content type                            [string] [default: "application/json"]
      --bearerToken    bearer token without Bearer prefix, added as
                       Authorization header                            [string]
      --timeout        request timeout                                 [number] [default: 5000]
```
